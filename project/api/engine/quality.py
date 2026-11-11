"""M1  DataQualityChecker and QualityReport."""
from dataclasses import dataclass, field
import pandas as pd


@dataclass
class QualityReport:
    summary: dict = field(default_factory=dict)
    issues: list = field(default_factory=list)

    def to_dict(self):
        return {"summary": self.summary, "issues": self.issues}

    def to_text(self):
        lines = [f"{k}: {v}" for k, v in self.summary.items()]
        lines += [f"[{i['severity']}] {i['check']}: {i['count']} ({i['percent']}%) - {i['detail']}" for i in self.issues]
        return "\n".join(lines)


class DataQualityChecker:
    def __init__(self, config, caps=None):
        self.cfg = config
        self.rules = config["rules"]
        self.caps = caps or {}
        self.n = 0
        self.issues = []

    def has(self, key):
        """True if the dataset provides this optional field (default: yes)."""
        return self.caps.get(key, True)

    def _add(self, check, count, detail, severity):
        pct = round(100 * count / self.n, 2) if self.n else 0
        self.issues.append({"check": check, "count": int(count), "percent": pct, "detail": detail,
                            "severity": severity if count else "ok"})

    # ---- individual checks -------------------------------------------------
    def check_missing(self, df):
        miss = df.isna().sum()
        self._add("Missing values", int(miss.sum()), "cells with no value across all columns", "warning")
        return miss[miss > 0].to_dict()

    def check_duplicates(self, df):
        d = int(df.duplicated().sum()) + (int(df["Order ID"].duplicated().sum()) if self.has("order_id") else 0)
        self._add("Duplicate records", d, "fully duplicated rows plus repeated Order IDs" if self.has("order_id") else "fully duplicated rows", "warning")
        return d

    def check_dates(self, df):
        s = pd.to_datetime(df["Sales Date"], errors="coerce")
        bad = int(s.isna().sum())
        if self.has("order_date"):
            o = pd.to_datetime(df["Order Date"], errors="coerce")
            bad += int(o.isna().sum())
        if self.has("ship_date"):
            sh = pd.to_datetime(df["Ship Date"], errors="coerce")
            bad += int(sh.isna().sum())
        self._add("Unparseable dates", bad, "date values that cannot be read as a date", "error")
        if self.has("order_date"):
            self._add("Sales Date earlier than Order Date", int((s < o).sum()),
                      "sale recorded before the order was placed; Sales Date is used as the authoritative date", "warning")
        if self.has("ship_date") and self.has("order_date"):
            self._add("Ship Date earlier than Order Date", int((sh < o).sum()), "shipping before ordering", "error")
        if "Year" in df.columns:
            self._add("Year differs from Sales Date year", int((df["Year"] != s.dt.year).sum()),
                      "the Year column is not derived from Sales Date; Sales_Year is recomputed", "warning")

    def check_ranges(self, df):
        if self.has("discount"):
            lo, hi = self.rules["discount_range"]
            self._add("Discount outside allowed range", int(((df["Discount"] < lo) | (df["Discount"] > hi)).sum()),
                      f"discount not between {lo} and {hi}", "error")
        if self.has("quantity"):
            self._add("Quantity below minimum", int((df["Quantity"] < self.rules["min_quantity"]).sum()), "quantity less than 1", "error")
        if self.has("profit"):
            self._add("Profit greater than Sales", int((df["Profit"] > df["Sales"]).sum()), "impossible margin above 100%", "error")
        self._add("Negative Sales", int((df["Sales"] < 0).sum()), "sales below zero", "error")

    def check_consistency(self, df):
        if self.has("region") and self.has("state"):
            exp = df["State"].map(self.cfg["state_region"])
            self._add("Region inconsistent with State", int((exp.notna() & (exp != df["Region"])).sum()),
                      "Region does not match the expected region for the State (mapping in config.yaml; unknown states are not checked)", "warning")
        if self.has("dob"):
            dob = pd.to_datetime(df["Date of Birth"], errors="coerce")
            sd = pd.to_datetime(df["Sales Date"], errors="coerce")
            age = (sd - dob).dt.days / 365.25
            self._add("Customers under 18", int((age < self.rules["min_adult_age"]).sum()), "age at sale date below 18", "warning")
        if self.has("customer_id"):
            repeats = int(df["Customer ID"].duplicated().sum())
            self._add("Customers with repeat orders", repeats,
                      "0 means every customer has a single order, so RFM and churn analysis are not possible"
                      if repeats == 0 else "customers appearing more than once", "info")

    # ---- report ------------------------------------------------------------
    def generate_report(self, df, caps=None):
        if caps is not None:
            self.caps = caps
        self.n = len(df)
        self.issues = []
        missing_cols = self.check_missing(df)
        self.check_duplicates(df)
        self.check_dates(df)
        self.check_ranges(df)
        self.check_consistency(df)
        absent = [k for k, v in self.caps.items() if not v]
        if absent:
            self._add("Optional fields not in the file", len(absent), "defaults used for: " + ", ".join(absent), "info")
        summary = {"rows": self.n, "columns": int(df.shape[1]), "columns_with_missing": len(missing_cols),
                   "checks_with_findings": int(sum(1 for i in self.issues if i["count"] > 0 and i["severity"] not in ("info", "ok")))}
        return QualityReport(summary=summary, issues=self.issues)
