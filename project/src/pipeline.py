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

    def run_pipeline(self, source=None, filename=None):
        """M1 -> M2 -> M3. Returns the processed DataFrame and a status dictionary."""
        self.steps = []
        p = self.cfg["paths"]
        source = source if source is not None else self.base / self.cfg["default_dataset"]
        # M1: ingest and validate
        ing = DataIngestor(self.cfg["expected_columns"])
        raw = self.run_stage("M1 load_file", ing.load_file, source, filename)
        self.store.save(f"{p['raw']}/validated_raw.parquet", raw)                      # D1
        report = self.run_stage("M1 quality report", DataQualityChecker(self.cfg).generate_report, raw)
        self.store.save(f"{p['logs']}/quality_report.json", report.to_dict())            # D5
        # M2: clean and engineer
        cleaner = DataCleaner(self.cfg)
        clean = self.run_stage("M2 clean", cleaner.run, raw)
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
        self.log_step(f"Pipeline complete: {len(df)} records processed")
        return df, {"rows_in": len(raw), "rows_out": len(df), "steps": list(self.steps), "report": report}
