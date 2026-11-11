"""PipelineController: runs the stages in order, applies configuration and logs every step."""
import logging
import time
from pathlib import Path
import yaml

from .store import DataStore
from .ingest import DataIngestor
from .quality import DataQualityChecker
from .clean import DataCleaner
from .features import FeatureEngineer
from .eda import EDAEngine
from .kpi import KPIEngine
from .schema import suggest_mapping, apply_mapping, FULL_CAPS
from .models import ForecastModel, ProfitPredictor, AnomalyDetector, CustomerSegmenter
import numpy as np

ROOT = Path(__file__).resolve().parent.parent


def load_config(path=None):
    with open(path or ROOT / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


class PipelineController:
    def __init__(self, config=None, base_path=None):
        self.cfg = config or load_config()
        self.base = Path(base_path or ROOT)
        self.store = DataStore(self.base)
        self.logger = self._make_logger()
        self.steps = []

    def _make_logger(self):
        (self.base / self.cfg["paths"]["logs"]).mkdir(parents=True, exist_ok=True)
        lg = logging.getLogger("pipeline:" + str(self.base))
        lg.setLevel(logging.INFO)
        if not lg.handlers:
            fh = logging.FileHandler(self.base / self.cfg["paths"]["logs"] / "pipeline.log", encoding="utf-8")
            fh.setFormatter(logging.Formatter("%(asctime)s | %(message)s"))
            lg.addHandler(fh)
        return lg

    def log_step(self, msg):
        self.logger.info(msg)
        self.steps.append(msg)

    def run_stage(self, name, fn, *args):
        t0 = time.time()
        out = fn(*args)
        self.log_step(f"{name} finished in {time.time() - t0:.2f}s")
        return out

    def run_pipeline(self, source=None, filename=None, train_models=True, mapping=None):
        """M1 -> M2 -> M3 -> M4 -> M5. Returns the scored DataFrame and a status dictionary.
        `mapping` maps the file's columns to the fields the system understands (auto-detected when omitted)."""
        self.steps = []
        p = self.cfg["paths"]
        source = source if source is not None else self.base / self.cfg["default_dataset"]
        # M1: ingest, map columns, validate
        ing = DataIngestor()
        raw = self.run_stage("M1 load_file", ing.load_file, source, filename)
        self.store.save(f"{p['raw']}/validated_raw.parquet", raw.astype(str))           # D1
        mapping = mapping if mapping is not None else suggest_mapping(raw.head(1000))
        std, caps, notes = apply_mapping(raw, mapping)
        self.log_step("M1 column mapping: " + ", ".join(f"{k} <- {v}" for k, v in mapping.items() if v))
        for n in notes:
            self.log_step("M1 note: " + n)
        report = self.run_stage("M1 quality report", DataQualityChecker(self.cfg, caps).generate_report, std)
        self.store.save(f"{p['logs']}/quality_report.json", report.to_dict())            # D5
        # M2: clean and engineer
        cleaner = DataCleaner(self.cfg, caps)
        clean = self.run_stage("M2 clean", cleaner.run, std)
        for m in cleaner.log:
            self.log_step("M2 " + m)
        df = self.run_stage("M2 features", FeatureEngineer().run, clean)
        self.store.save(f"{p['processed']}/clean_sales.parquet", df)                     # D2
        self.store.save(f"{p['logs']}/cleaning_log.json", cleaner.log)                   # D5
        # M3: EDA and KPIs
        kpi, eda = KPIEngine(), EDAEngine()
        self.store.save(f"{p['results']}/kpi_overall.json", kpi.totals(df))              # D4
        self.store.save(f"{p['results']}/kpi_by_category.csv", kpi.compute_kpis(df, "Category of Goods"))
        self.store.save(f"{p['results']}/kpi_by_state.csv", kpi.compute_kpis(df, "State"))
        self.store.save(f"{p['results']}/eda_summary.csv", eda.summary_stats(df))
        self.store.save(f"{p['results']}/eda_correlations.csv", eda.correlations(df).reset_index())
        analytics = {}
        if train_models:
            df, analytics = self.run_analytics(df, caps)
        self.log_step(f"Pipeline complete: {len(df)} records processed")
        return df, {"rows_in": len(raw), "rows_out": len(df), "steps": list(self.steps), "report": report, "analytics": analytics,
                    "mapping": {k: v for k, v in mapping.items() if v}, "caps": caps, "notes": notes}

    # ---- M4 and M5 -----------------------------------------------------------
    def run_analytics(self, df, caps=None):
        """Train and evaluate all models; save them to D3 and results to D4. A failing model does not stop the others."""
        p, mc = self.cfg["paths"], self.cfg.get("models", {})
        caps = caps or FULL_CAPS
        out = {"errors": {}}
        df = df.copy()

        def attempt(name, fn):
            t0 = time.time()
            try:
                fn()
                self.log_step(f"{name} finished in {time.time() - t0:.1f}s")
            except Exception as e:                                           # keep the dashboard usable
                out["errors"][name] = str(e)
                self.log_step(f"{name} FAILED: {e}")

        def forecasts():
            for target, key in (("Sales", "forecast_sales"), ("Profit", "forecast_profit")):
                if target == "Profit" and not caps.get("profit", True):
                    continue
                m = ForecastModel(target, mc).fit(df)
                fc = m.forecast()
                m.save(self.base / p["models"] / f"forecast_{target.lower()}.joblib")
                series = m.series.rename("value").reset_index()
                series["Year_Month"] = series["Year_Month"].astype(str)
                out[key] = {"best": m.best, "comparison": m.comparison, "test_table": m.test_table, "forecast": fc, "series": series}
                self.store.save(f"{p['results']}/forecast_{target.lower()}.csv", fc)
                self.store.save(f"{p['results']}/forecast_{target.lower()}_comparison.csv", m.comparison)

        def profit():
            m = ProfitPredictor(mc).fit(df)
            m.save(self.base / p["models"] / "profit_predictor.joblib")
            out["profit"] = {"best": m.best, "comparison": m.comparison, "cv": m.cv_table, "scatter": m.scatter,
                             "shap_profit": m.shap_profit, "shap_margin": m.shap_margin, "margin_metrics": m.margin_metrics}
            self.store.save(f"{p['results']}/profit_model_comparison.csv", m.comparison)
            self.store.save(f"{p['results']}/shap_profit.csv", m.shap_profit)
            self.store.save(f"{p['results']}/shap_margin.csv", m.shap_margin)

        def anomalies():
            m = AnomalyDetector(mc).fit(df)
            scored = m.detect(df)
            for c in ("anomaly_score", "anomaly_flag", "anomaly_reason"):
                df[c] = scored[c].values
            m.save(self.base / p["models"] / "anomaly_detector.joblib")
            out["anomalies"] = {"metrics": m.metrics, "table": m.list_anomalies(scored)}
            self.store.save(f"{p['results']}/anomalies.csv", out["anomalies"]["table"])

        def segments():
            m = CustomerSegmenter(mc).fit(df)
            labels = np.array([f"Segment {i + 1}" for i in m.predict(df)])
            prof = m.profile_segments(df, labels)
            df["Cluster"] = labels
            m.save(self.base / p["models"] / "customer_segmenter.joblib")
            out["segments"] = {"k": m.k, "silhouette": m.metrics["silhouette"], "k_scores": m.k_scores, "profile": prof, "pca": m.pca_points}
            self.store.save(f"{p['results']}/segment_profile.csv", prof)

        attempt("M4 forecasting", forecasts)
        if caps.get("profit", True):
            attempt("M4 profit prediction", profit)
        else:
            self.log_step("M4 profit prediction skipped: no Profit column")
        attempt("M5 anomaly detection", anomalies)
        attempt("M5 customer segmentation", segments)
        keep = [c for c in ("Order ID", "anomaly_score", "anomaly_flag", "anomaly_reason", "Cluster") if c in df.columns]
        self.store.save(f"{p['results']}/scored_records.parquet", df[keep])
        return df, out
