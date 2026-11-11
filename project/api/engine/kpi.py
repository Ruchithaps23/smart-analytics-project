"""M3  KPIEngine: business KPIs and trends."""
import pandas as pd


class KPIEngine:
    def totals(self, df):
        sales, profit = df["Sales"].sum(), df["Profit"].sum()
        return {"total_sales": float(sales), "total_profit": float(profit),
                "profit_margin_pct": float(100 * profit / sales) if sales else 0.0,
                "avg_discount_pct": float(100 * df["Discount"].mean()) if len(df) else 0.0,
                "orders": int(df["Order ID"].nunique()), "units_sold": int(df["Quantity"].sum()),
                "avg_ship_days": float(df["Ship_Days"].mean()) if len(df) else 0.0}

    def compute_kpis(self, df, group_by):
        g = df.groupby(group_by).agg(Sales=("Sales", "sum"), Profit=("Profit", "sum"), Orders=("Order ID", "nunique"),
                                     Units=("Quantity", "sum"), Avg_Discount=("Discount", "mean")).reset_index()
        g["Margin_%"] = (100 * g["Profit"] / g["Sales"]).round(2)
        g["Avg_Discount"] = (100 * g["Avg_Discount"]).round(2)
        return g.sort_values("Sales", ascending=False).reset_index(drop=True)

    def trend(self, df, period="Year_Month"):
        t = df.groupby(period).agg(Sales=("Sales", "sum"), Profit=("Profit", "sum")).reset_index()
        return t.sort_values(period).reset_index(drop=True)
