"""M6 (Task 4 version): Streamlit dashboard with Overview, Data Quality and EDA pages.
Run with:  streamlit run app.py
"""
import pandas as pd
import plotly.express as px
import streamlit as st

from src.pipeline import PipelineController, load_config
from src.kpi import KPIEngine
from src.eda import EDAEngine

st.set_page_config(page_title="Smart Data Analytics System", layout="wide")
CFG = load_config()
kpi, eda = KPIEngine(), EDAEngine()


@st.cache_data(show_spinner="Running pipeline (M1 to M3)...")
def run(file_bytes, filename):
    """Run the pipeline once per uploaded file and cache the result."""
    import io
    ctl = PipelineController()
    source = io.BytesIO(file_bytes) if file_bytes is not None else None
    df, status = ctl.run_pipeline(source, filename)
    return df, status["report"].to_dict(), status["steps"]


# ---------------- sidebar: data source ----------------
st.sidebar.title("Smart Data Analytics")
up = st.sidebar.file_uploader("Upload dataset (CSV or Excel)", type=["csv", "xlsx", "xls"])
try:
    df, report, steps = run(up.getvalue() if up else None, up.name if up else None)
except ValueError as e:
    st.error(f"Could not process the file: {e}")
    st.stop()

# ---------------- sidebar: filters ----------------
st.sidebar.header("Filters")
yrs = sorted(df["Sales_Year"].unique())
yr = st.sidebar.select_slider("Sales year", options=yrs, value=(yrs[0], yrs[-1]))


def multi(label, col):
    opts = sorted(df[col].dropna().unique())
    return st.sidebar.multiselect(label, opts, default=opts)


cat, reg, stt = multi("Category", "Category of Goods"), multi("Region", "Region"), multi("State", "State")
outl, city, seg = multi("Outlet type", "Outlet Type"), multi("City type", "City Type"), multi("Segment", "Segment")
f = df[df["Sales_Year"].between(*yr) & df["Category of Goods"].isin(cat) & df["Region"].isin(reg) & df["State"].isin(stt)
       & df["Outlet Type"].isin(outl) & df["City Type"].isin(city) & df["Segment"].isin(seg)]
page = st.sidebar.radio("Page", ["Overview", "Data Quality", "EDA"])
st.sidebar.caption(f"{len(f):,} of {len(df):,} records selected")
if f.empty:
    st.warning("No records match the selected filters.")
    st.stop()

# ---------------- Overview ----------------
if page == "Overview":
    st.title("Business Overview")
    t = kpi.totals(f)
    c = st.columns(5)
    c[0].metric("Total sales", f"{t['total_sales'] / 1e6:,.1f} M")
    c[1].metric("Total profit", f"{t['total_profit'] / 1e6:,.1f} M")
    c[2].metric("Profit margin", f"{t['profit_margin_pct']:.1f}%")
    c[3].metric("Avg discount", f"{t['avg_discount_pct']:.1f}%")
    c[4].metric("Orders", f"{t['orders']:,}")
    tr = kpi.trend(f, "Year_Month")
    st.plotly_chart(px.line(tr, x="Year_Month", y=["Sales", "Profit"], title="Monthly sales and profit"), width="stretch")
    a, b = st.columns(2)
    a.plotly_chart(px.bar(kpi.compute_kpis(f, "Category of Goods"), x="Category of Goods", y=["Sales", "Profit"], barmode="group",
                          title="Sales and profit by category"), width="stretch")
    b.plotly_chart(px.bar(kpi.compute_kpis(f, "State"), x="State", y="Sales", color="Margin_%", title="Sales by state (colour = margin %)"),
                   width="stretch")
    dim = st.selectbox("KPI table grouped by", ["Region", "Outlet Type", "City Type", "Segment", "Ship Mode", "Sub-Category", "Sales_Year"])
    st.dataframe(kpi.compute_kpis(f, dim), width="stretch", hide_index=True)

# ---------------- Data Quality ----------------
elif page == "Data Quality":
    st.title("Data Quality Report")
    s = report["summary"]
    c = st.columns(4)
    c[0].metric("Rows", f"{s['rows']:,}")
    c[1].metric("Columns", s["columns"])
    c[2].metric("Columns with missing values", s["columns_with_missing"])
    c[3].metric("Checks with findings", s["checks_with_findings"])
    q = pd.DataFrame(report["issues"]).rename(columns={"check": "Check", "count": "Records", "percent": "% of rows",
                                                       "detail": "Detail", "severity": "Status"})
    st.dataframe(q[["Status", "Check", "Records", "% of rows", "Detail"]], width="stretch", hide_index=True)
    st.subheader("Flags added by the cleaning stage")
    fl = pd.DataFrame({"Flag": ["date_conflict_flag", "region_state_flag", "minor_flag"],
                       "Records flagged": [int(df.date_conflict_flag.sum()), int(df.region_state_flag.sum()), int(df.minor_flag.sum())]})
    st.dataframe(fl, width="stretch", hide_index=True)
    st.info("Records are flagged, not deleted. Sales Date is used as the authoritative date (see config.yaml).")
    with st.expander("Pipeline processing log"):
        for x in steps:
            st.write("-", x)

# ---------------- EDA ----------------
else:
    st.title("Exploratory Data Analysis")
    st.subheader("Summary statistics")
    st.dataframe(eda.summary_stats(f), width="stretch", hide_index=True)
    a, b = st.columns(2)
    col = a.selectbox("Distribution of", ["Sales", "Profit", "Profit_Margin", "Discount", "Quantity", "Age", "Ship_Days"])
    a.plotly_chart(px.histogram(f, x=col, nbins=40, title=f"Distribution of {col}"), width="stretch")
    b.plotly_chart(px.imshow(eda.correlations(f), text_auto=True, color_continuous_scale="RdBu_r", zmin=-1, zmax=1,
                             title="Correlation matrix"), width="stretch")
    c1, c2 = st.columns(2)
    smp = f.sample(min(len(f), 5000), random_state=1)
    c1.plotly_chart(px.scatter(smp, x="Discount", y="Profit_Margin", opacity=0.4, title="Discount vs profit margin (5,000-record sample)"),
                    width="stretch")
    grp = c2.selectbox("Compare by", ["Category of Goods", "Region", "Outlet Type", "City Type", "Segment", "Ship Mode"])
    c2.plotly_chart(px.box(f, x=grp, y="Profit_Margin", title=f"Profit margin by {grp}"), width="stretch")
    st.caption("Customer names and dates of birth are not shown anywhere in the dashboard (privacy requirement).")
