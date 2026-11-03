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
    def __init__(self, config):
        self.cfg = config
        self.rules = config["rules"]
        self.n = 0
        self.issues = []

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
        d = int(df.duplicated().sum()) + int(df["Order ID"].duplicated().sum())
        self._add("Duplicate records", d, "fully duplicated rows plus repeated Order IDs", "warning")
        return d

    def check_dates(self, df):
        s = pd.to_datetime(df["Sales Date"], errors="coerce")
        o = pd.to_datetime(df["Order Date"], errors="coerce")
        sh = pd.to_datetime(df["Ship Date"], errors="coerce")
        self._add("Unparseable dates", int(s.isna().sum() + o.isna().sum() + sh.isna().sum()),
                  "Sales, Order or Ship Date that cannot be read as a date", "error")
        self._add("Sales Date earlier than Order Date", int((s < o).sum()),
                  "sale recorded before the order was placed; Sales Date is used as the authoritative date", "warning")
        self._add("Ship Date earlier than Order Date", int((sh < o).sum()), "shipping before ordering", "error")
        self._add("Year differs from Sales Date year", int((df["Year"] != s.dt.year).sum()),
                  "the Year column is not derived from Sales Date; Sales_Year is recomputed", "warning")

    def check_ranges(self, df):
        lo, hi = self.rules["discount_range"]
        self._add("Discount outside allowed range", int(((df["Discount"] < lo) | (df["Discount"] > hi)).sum()),
                  f"discount not between {lo} and {hi}", "error")
        self._add("Quantity below minimum", int((df["Quantity"] < self.rules["min_quantity"]).sum()), "quantity less than 1", "error")
        self._add("Profit greater than Sales", int((df["Profit"] > df["Sales"]).sum()), "impossible margin above 100%", "error")
        self._add("Negative Sales", int((df["Sales"] < 0).sum()), "sales below zero", "error")

    def check_consistency(self, df):
        exp = df["State"].map(self.cfg["state_region"])
        self._add("Region inconsistent with State", int((exp.notna() & (exp != df["Region"])).sum()),
                  "Region does not match the expected region for the State (mapping in config.yaml)", "warning")
        dob = pd.to_datetime(df["Date of Birth"], errors="coerce")
        sd = pd.to_datetime(df["Sales Date"], errors="coerce")
        age = (sd - dob).dt.days / 365.25
        self._add("Customers under 18", int((age < self.rules["min_adult_age"]).sum()), "age at sale date below 18", "warning")
        repeats = int(df["Customer ID"].duplicated().sum())
        self._add("Customers with repeat orders", repeats,
                  "0 means every customer has a single order, so RFM and churn analysis are not possible"
                  if repeats == 0 else "customers appearing more than once", "info")

    # ---- report ------------------------------------------------------------
    def generate_report(self, df):
        self.n = len(df)
        self.issues = []
        missing_cols = self.check_missing(df)
        self.check_duplicates(df)
        self.check_dates(df)
        self.check_ranges(df)
        self.check_consistency(df)
        summary = {"rows": self.n, "columns": int(df.shape[1]), "columns_with_missing": len(missing_cols),
                   "checks_with_findings": int(sum(1 for i in self.issues if i["count"] > 0 and i["severity"] not in ("info", "ok")))}
        return QualityReport(summary=summary, issues=self.issues)
