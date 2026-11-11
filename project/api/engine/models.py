"""M4 and M5: model classes. All inherit from the abstract MLModel (Task 3 class diagram B)."""
from abc import ABC, abstractmethod
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.decomposition import PCA
from sklearn.ensemble import IsolationForest, RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score, silhouette_score
from sklearn.model_selection import cross_val_score, train_test_split
from xgboost import XGBRegressor

DEFAULTS = {"random_state": 42, "forecast_test_months": 12, "forecast_horizon": 12, "rf_estimators": 100,
            "rf_max_depth": 12, "xgb_estimators": 250, "cv_folds": 3, "cv_sample": 20000, "shap_sample": 2000,
            "contamination": 0.01, "margin_low": 0.06, "margin_high": 0.29, "k_range": [2, 8], "silhouette_sample": 8000}


def _vary(df, cols):
    """Columns that exist, have values and are not constant."""
    return [c for c in cols if c in df.columns and df[c].notna().any() and df[c].nunique() > 1]


def _rmse(y, p):
    return float(np.sqrt(mean_squared_error(y, p)))


class MLModel(ABC):
    """Common interface: fit, predict, evaluate, save."""
    name = "model"

    def __init__(self, cfg=None):
        self.cfg = {**DEFAULTS, **(cfg or {})}
        self.metrics = {}

    @abstractmethod
    def fit(self, df):
        ...

    @abstractmethod
    def predict(self, X):
        ...

    def evaluate(self):
        return self.metrics

    def save(self, path):
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, path)
        return path


# =============================================================================
# M4  Forecasting
# =============================================================================
class ForecastModel(MLModel):
    name = "forecast"

    def __init__(self, target="Sales", cfg=None):
        super().__init__(cfg)
        self.target = target
        self.best = None
        self.comparison = None
        self.test_table = None
        self.series = None
        self.final_model = None

    @staticmethod
    def make_lag_features(s):
        return pd.DataFrame({"lag1": s.shift(1), "lag2": s.shift(2), "lag3": s.shift(3), "lag12": s.shift(12),
                             "roll3": s.shift(1).rolling(3).mean(), "month": s.index.month}, index=s.index)

    def _series(self, df):
        s = df.groupby("Year_Month")[self.target].sum().sort_index()
        s.index = pd.PeriodIndex(s.index, freq="M")
        return s

    def _make(self, kind):
        if kind == "Linear Regression":
            return LinearRegression()
        return XGBRegressor(n_estimators=self.cfg["xgb_estimators"], max_depth=2, learning_rate=0.05, subsample=0.9,
                            random_state=self.cfg["random_state"], n_jobs=1)

    def fit(self, df):
        s = self._series(df)
        F = self.make_lag_features(s)
        ok = F.dropna().index
        n_test = self.cfg["forecast_test_months"] if len(ok) >= 24 else max(3, len(ok) // 3)
        if len(ok) < 9:
            raise ValueError("Forecasting needs at least about 22 months (nearly 2 years) of dated data; this dataset has "
                             f"{len(s)} months.")
        test_idx, train_idx = ok[-n_test:], ok[:-n_test]
        self.series = s
        preds = {"Seasonal naive (same month last year)": F.loc[test_idx, "lag12"].values,
                 "Moving average (last 3 months)": F.loc[test_idx, "roll3"].values}
        for kind in ("Linear Regression", "XGBoost"):
            m = self._make(kind).fit(F.loc[train_idx], s.loc[train_idx])
            preds[kind] = m.predict(F.loc[test_idx])
        actual = s.loc[test_idx].values
        rows = []
        for k, p in preds.items():
            rows.append({"Model": k, "MAE": mean_absolute_error(actual, p), "RMSE": _rmse(actual, p),
                         "MAPE %": float(np.mean(np.abs((actual - p) / actual)) * 100)})
        self.comparison = pd.DataFrame(rows).sort_values("RMSE").reset_index(drop=True)
        self.best = self.comparison.loc[0, "Model"]
        tt = pd.DataFrame({"Year_Month": test_idx.astype(str), "Actual": actual})
        for k, p in preds.items():
            tt[k] = p
        self.test_table = tt
        self.final_model = self._make(self.best).fit(F.loc[ok], s.loc[ok]) if self.best in ("Linear Regression", "XGBoost") else None
        self.metrics = self.comparison.set_index("Model").to_dict("index")
        return self

    def predict(self, X):
        return self.final_model.predict(X)

    def forecast(self, months=None):
        months = months or self.cfg["forecast_horizon"]
        hist = list(self.series.values)
        idx = pd.period_range(self.series.index[-1] + 1, periods=months, freq="M")
        out = []
        for per in idx:
            if self.best.startswith("Seasonal"):
                v = hist[-12]
            elif self.best.startswith("Moving"):
                v = float(np.mean(hist[-3:]))
            else:
                row = pd.DataFrame([{"lag1": hist[-1], "lag2": hist[-2], "lag3": hist[-3], "lag12": hist[-12],
                                     "roll3": float(np.mean(hist[-3:])), "month": per.month}])
                v = float(self.final_model.predict(row)[0])
            hist.append(v)
            out.append(v)
        return pd.DataFrame({"Year_Month": idx.astype(str), "Forecast": out, "Target": self.target})


# =============================================================================
# M4  Profit prediction and margin drivers (with SHAP explanations)
# =============================================================================
class ProfitPredictor(MLModel):
    name = "profit_predictor"
    CAT_ALL = ["Category of Goods", "Outlet Type", "City Type", "Segment", "Ship Mode", "Region"]
    NUM_ALL = ["Sales", "Quantity", "Discount", "Age", "Ship_Days"]

    def __init__(self, cfg=None):
        super().__init__(cfg)
        self.num, self.cat, self.num_margin, self.medians = [], [], [], {}
        self.model = self.best = self.columns = self.margin_model = self.margin_columns = None
        self.comparison = self.cv_table = self.scatter = self.shap_profit = self.shap_margin = self.margin_metrics = None

    def _X(self, df, num, columns=None):
        d = df[num + self.cat].copy()
        for c in num:
            d[c] = d[c].fillna(self.medians.get(c, 0.0))
        X = pd.get_dummies(d, columns=self.cat, dtype=float)
        return X if columns is None else X.reindex(columns=columns, fill_value=0.0)

    def _group(self, columns, values, num):
        """Aggregate one-hot SHAP values back to the original feature."""
        agg = {}
        for c, v in zip(columns, values):
            key = next((k for k in self.cat if c.startswith(k + "_")), c)
            agg[key] = agg.get(key, 0.0) + float(v)
        return pd.DataFrame({"Feature": list(agg), "Importance": list(agg.values())}).sort_values("Importance", ascending=False).reset_index(drop=True)

    def _shap(self, model, X, num):
        n = min(self.cfg["shap_sample"], len(X))
        Xs = X.sample(n, random_state=self.cfg["random_state"])
        try:
            import shap
            sv = shap.TreeExplainer(model).shap_values(Xs)
            vals = np.abs(sv).mean(axis=0)
        except Exception:                                   # fallback if SHAP is unavailable
            vals = model.feature_importances_
        return self._group(list(X.columns), vals, num)

    def fit(self, df):
        c = self.cfg
        if "Profit" not in df.columns or df["Profit"].notna().sum() < 100:
            raise ValueError("Profit prediction needs a Profit column with at least 100 values.")
        self.num = ["Sales"] + [x for x in _vary(df, self.NUM_ALL) if x != "Sales"]
        self.cat = _vary(df, self.CAT_ALL)
        self.num_margin = [x for x in self.num if x != "Sales"]
        self.medians = {x: float(df[x].median()) for x in self.num}
        df = df[df["Profit"].notna()]
        X, y = self._X(df, self.num), df["Profit"]
        self.columns = list(X.columns)
        Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.2, random_state=c["random_state"])
        models = {"Linear Regression": LinearRegression(),
                  "Random Forest": RandomForestRegressor(n_estimators=c["rf_estimators"], max_depth=c["rf_max_depth"],
                                                         n_jobs=-1, random_state=c["random_state"]),
                  "XGBoost": XGBRegressor(n_estimators=c["xgb_estimators"], max_depth=5, learning_rate=0.1, subsample=0.9,
                                          n_jobs=-1, random_state=c["random_state"])}
        rows, fitted = [], {}
        for k, m in models.items():
            m.fit(Xtr, ytr)
            p = m.predict(Xte)
            rows.append({"Model": k, "MAE": mean_absolute_error(yte, p), "RMSE": _rmse(yte, p), "R2": r2_score(yte, p)})
            fitted[k] = (m, p)
        self.comparison = pd.DataFrame(rows).sort_values("RMSE").reset_index(drop=True)
        self.best = self.comparison.loc[0, "Model"]
        self.model, best_pred = fitted[self.best]
        # cross-validation on a sample (R2)
        n = min(c["cv_sample"], len(X))
        Xs = X.sample(n, random_state=c["random_state"])
        ys = y.loc[Xs.index]
        cv = []
        for k, m in models.items():
            sc_ = cross_val_score(type(m)(**m.get_params()), Xs, ys, cv=c["cv_folds"], scoring="r2")
            cv.append({"Model": k, "CV R2 mean": float(np.mean(sc_)), "CV R2 std": float(np.std(sc_))})
        self.cv_table = pd.DataFrame(cv)
        sc = pd.DataFrame({"Actual": yte.values, "Predicted": best_pred}).sample(min(1500, len(yte)), random_state=1)
        self.scatter = sc.reset_index(drop=True)
        xgb = fitted["XGBoost"][0]
        self.shap_profit = self._shap(xgb, Xte, self.num)
        # margin drivers (Sales excluded, so the explanation is not dominated by Sales)
        if self.num_margin or self.cat:
            Xm, ym = self._X(df, self.num_margin), df["Profit_Margin"].replace([np.inf, -np.inf], np.nan)
            ok = ym.notna()
            Xm, ym = Xm[ok], ym[ok]
            self.margin_columns = list(Xm.columns)
            Xmtr, Xmte, ymtr, ymte = train_test_split(Xm, ym, test_size=0.2, random_state=c["random_state"])
            self.margin_model = XGBRegressor(n_estimators=c["xgb_estimators"], max_depth=4, learning_rate=0.1, subsample=0.9,
                                             n_jobs=-1, random_state=c["random_state"]).fit(Xmtr, ymtr)
            pm = self.margin_model.predict(Xmte)
            self.margin_metrics = {"MAE": float(mean_absolute_error(ymte, pm)), "RMSE": _rmse(ymte, pm), "R2": float(r2_score(ymte, pm))}
            self.shap_margin = self._shap(self.margin_model, Xmte, self.num_margin)
        self.metrics = {"profit": self.comparison.set_index("Model").to_dict("index"), "margin": self.margin_metrics, "best": self.best}
        return self

    def predict(self, df):
        return self.model.predict(self._X(df, self.num, self.columns))

    def predict_margin(self, df):
        if self.margin_model is None:
            return np.array([np.nan] * len(df))
        return self.margin_model.predict(self._X(df, self.num_margin, self.margin_columns))

    def explain(self):
        return self.shap_profit

    def margin_drivers(self):
        return self.shap_margin

    def predict_one(self, **kw):
        row = pd.DataFrame([kw])
        return float(self.predict(row)[0]), float(self.predict_margin(row)[0])


# =============================================================================
# M5  Anomaly detection
# =============================================================================
class AnomalyDetector(MLModel):
    name = "anomaly_detector"
    FEATURES_ALL = ["Sales", "Quantity", "Discount", "Profit", "Profit_Margin", "Ship_Days"]

    def __init__(self, cfg=None):
        super().__init__(cfg)
        self.iso = None
        self.mu = self.sd = None
        self.features = []

    def _scaled(self, df):
        return ((df[self.features].fillna(self.mu) - self.mu) / self.sd).values

    def fit(self, df):
        self.features = _vary(df, self.FEATURES_ALL)
        if not self.features:
            raise ValueError("No varying numeric columns to analyse.")
        self.mu, self.sd = df[self.features].mean(), df[self.features].std(ddof=0).replace(0, 1)
        self.iso = IsolationForest(n_estimators=100, contamination=self.cfg["contamination"],
                                   random_state=self.cfg["random_state"], n_jobs=-1).fit(self._scaled(df))
        return self

    def predict(self, df):
        return self.iso.predict(self._scaled(df))

    def detect(self, df):
        """Returns a copy of df with anomaly_score, anomaly_flag and anomaly_reason columns."""
        out = df.copy()
        out["anomaly_score"] = -self.iso.score_samples(self._scaled(df))
        iso_flag = self.iso.predict(self._scaled(df)) == -1
        if "Profit_Margin" in self.features:
            low = out["Profit_Margin"] < self.cfg["margin_low"]
            high = out["Profit_Margin"] > self.cfg["margin_high"]
        else:
            low = high = pd.Series(False, index=out.index)
        out["anomaly_flag"] = iso_flag | low | high
        reason = np.where(low, "Unusually low margin", np.where(high, "Unusually high margin", ""))
        reason = np.where((reason == "") & iso_flag, "Unusual combination of values (Isolation Forest)", reason)
        out["anomaly_reason"] = reason
        self.metrics = {"records": len(out), "flagged": int(out["anomaly_flag"].sum()),
                        "flag_rate_pct": float(100 * out["anomaly_flag"].mean()), "isolation_forest": int(iso_flag.sum()),
                        "low_margin_rule": int(low.sum()), "high_margin_rule": int(high.sum())}
        return out

    def list_anomalies(self, df, top=500):
        cols = [c for c in ["Order ID", "Category of Goods", "State", "Sales", "Quantity", "Discount", "Profit", "Profit_Margin",
                            "Ship_Days"] if c in df.columns and (c in ("Order ID", "Sales") or df[c].nunique() > 1)] + ["anomaly_score", "anomaly_reason"]
        return df[df["anomaly_flag"]].sort_values("anomaly_score", ascending=False)[cols].head(top).reset_index(drop=True)


# =============================================================================
# M5  Customer segmentation
# =============================================================================
class CustomerSegmenter(MLModel):
    name = "customer_segmenter"
    NUM_ALL = ["Age", "Sales", "Quantity", "Discount", "Profit"]
    CAT_ALL = ["Segment", "City Type", "Outlet Type"]

    def __init__(self, cfg=None):
        super().__init__(cfg)
        self.num, self.cat = [], []
        self.k = None
        self.km = None
        self.k_scores = None
        self.profile = None
        self.pca_points = None
        self.mu = self.sd = self.columns = None

    def _X(self, df, fit=False):
        if fit:
            self.num, self.cat = _vary(df, self.NUM_ALL), _vary(df, self.CAT_ALL)
            if not self.num and not self.cat:
                raise ValueError("No varying columns to build customer segments from.")
        num = df[self.num]
        if fit:
            self.mu, self.sd = num.mean(), num.std(ddof=0).replace(0, 1)
        Z = (num.fillna(self.mu) - self.mu) / self.sd
        D = pd.get_dummies(df[self.cat], dtype=float) if self.cat else pd.DataFrame(index=df.index)
        X = pd.concat([Z, D], axis=1)
        if fit:
            self.columns = list(X.columns)
        return X.reindex(columns=self.columns, fill_value=0.0)

    def select_k(self, X):
        lo, hi = self.cfg["k_range"]
        n = min(self.cfg["silhouette_sample"], len(X))
        Xs = X.sample(n, random_state=self.cfg["random_state"])
        rows = []
        for k in range(lo, hi + 1):
            labels = KMeans(n_clusters=k, n_init=5, random_state=self.cfg["random_state"]).fit_predict(Xs)
            rows.append({"k": k, "Silhouette": float(silhouette_score(Xs, labels))})
        self.k_scores = pd.DataFrame(rows)
        return int(self.k_scores.loc[self.k_scores["Silhouette"].idxmax(), "k"])

    def fit(self, df):
        X = self._X(df, fit=True)
        self.k = self.select_k(X)
        self.km = KMeans(n_clusters=self.k, n_init=10, random_state=self.cfg["random_state"]).fit(X)
        return self

    def predict(self, df):
        return self.km.predict(self._X(df))

    def profile_segments(self, df, labels):
        d = df.assign(Cluster=labels)
        g = d.groupby("Cluster")
        p = g[self.num].mean().round(2)
        p.insert(0, "Customers", g.size())
        p.insert(1, "Share %", (100 * g.size() / len(d)).round(1))
        for c in self.cat:
            p[f"Main {c}"] = g[c].agg(lambda s: s.value_counts().idxmax())
        if "Profit_Margin" in d.columns and d["Profit_Margin"].notna().any():
            p["Avg Margin %"] = (100 * g["Profit_Margin"].mean()).round(2)
        self.profile = p.reset_index()
        X = self._X(df)
        n = min(4000, len(X))
        idx = X.sample(n, random_state=1).index
        ncomp = min(2, X.shape[1])
        pc = PCA(n_components=ncomp, random_state=1).fit_transform(X.loc[idx])
        if ncomp == 1:
            pc = np.column_stack([pc[:, 0], np.zeros(len(pc))])
        self.pca_points = pd.DataFrame({"PC1": pc[:, 0], "PC2": pc[:, 1], "Cluster": labels[df.index.get_indexer(idx)]})
        self.metrics = {"k": self.k, "silhouette": float(self.k_scores["Silhouette"].max())}
        return self.profile
