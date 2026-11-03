import sys
from pathlib import Path
import pandas as pd
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from src.pipeline import load_config
from src.ingest import DataIngestor
from src.quality import DataQualityChecker
from src.clean import DataCleaner
from src.features import FeatureEngineer
from src.kpi import KPIEngine
from src.eda import EDAEngine

CFG = load_config()


def sample(n=6):
    return pd.DataFrame({
        "Customer ID": [f"C{i}" for i in range(n)], "Customer Name": ["A"] * n, "Last Name": ["B"] * n,
        "Date of Birth": ["1990-01-01", "2015-06-01"] + ["1980-05-05"] * (n - 2), "Sales": [1000.0 + i * 100 for i in range(n)],
        "Year": [2020] * n, "Outlet Type": ["Large"] * n, "City Type": ["Tier 1"] * n, "Category of Goods": ["Furniture"] * n,
        "Region": ["East", "North"] + ["South"] * (n - 2), "Country": ["India"] * n, "Segment": ["Consumer"] * n,
        "Sales Date": ["2021-03-01", "2021-03-02"] + ["2021-04-01"] * (n - 2), "Order ID": [f"O{i}" for i in range(n)],
        "Order Date": ["2021-03-05", "2021-03-01"] + ["2021-03-25"] * (n - 2), "Ship Date": ["2021-03-08", "2021-03-04"] + ["2021-03-30"] * (n - 2),
        "Ship Mode": ["Same Day"] * n, "State": ["Punjab", "Punjab"] + ["Karnataka"] * (n - 2), "Postal Code": [160001] * n,
        "Product ID": [f"P{i}" for i in range(n)], "Sub-Category": ["Beds"] * n, "Product Name": ["Beds - 1"] * n,
        "Quantity": [2] * n, "Discount": [0.1] * n, "Profit": [150.0 + i * 10 for i in range(n)]})


def test_schema_validation_rejects_missing_columns():
    with pytest.raises(ValueError):
        DataIngestor(CFG["expected_columns"]).validate_format(sample().drop(columns=["Profit"]))


def test_quality_report_counts_date_conflict_and_minor():
    r = DataQualityChecker(CFG).generate_report(sample())
    d = {i["check"]: i["count"] for i in r.issues}
    assert d["Sales Date earlier than Order Date"] == 1   # only row 0 is dated before its order
    assert d["Customers under 18"] == 1
    assert d["Region inconsistent with State"] == 1       # Punjab labelled East


def test_cleaner_flags_and_keeps_records():
    df = DataCleaner(CFG).run(sample())
    assert len(df) == 6
    assert df["date_conflict_flag"].sum() == 1
    assert df["minor_flag"].sum() == 1
    assert df["Postal Code"].dtype == object or str(df["Postal Code"].dtype).startswith("str")


def test_duplicates_removed():
    s = pd.concat([sample(), sample().iloc[[0]]], ignore_index=True)
    assert len(DataCleaner(CFG).run(s)) == 6


def test_feature_derivation():
    df = FeatureEngineer().run(DataCleaner(CFG).run(sample()))
    assert df.loc[0, "Ship_Days"] == 3
    assert abs(df.loc[0, "Profit_Margin"] - 0.15) < 1e-6
    assert df.loc[0, "Sales_Year"] == 2021 and df.loc[0, "Quarter"] == 1


def test_kpis_match_manual_totals():
    df = FeatureEngineer().run(DataCleaner(CFG).run(sample()))
    t = KPIEngine().totals(df)
    assert t["total_sales"] == df["Sales"].sum()
    assert t["orders"] == 6
    g = KPIEngine().compute_kpis(df, "Category of Goods")
    assert g["Sales"].iloc[0] == df["Sales"].sum()


def test_eda_outputs_shape():
    df = FeatureEngineer().run(DataCleaner(CFG).run(sample()))
    assert EDAEngine().correlations(df).shape == (7, 7)
    assert EDAEngine().distributions(df, "Sales", bins=5)["count"].sum() == 6


def test_encode_and_scale():
    df = FeatureEngineer().run(DataCleaner(CFG).run(sample()))
    fe = FeatureEngineer()
    assert "Region_North" in fe.encode(df).columns
    assert abs(fe.scale(df)["Sales"].mean()) < 1e-9
