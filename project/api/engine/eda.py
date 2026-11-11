"""M3  EDAEngine: descriptive statistics, correlations and distributions."""
import numpy as np
import pandas as pd


class EDAEngine:
    MEASURES = ["Sales", "Profit", "Quantity", "Discount", "Profit_Margin", "Ship_Days", "Age"]

    def measures(self, df):
        """Measures that exist and vary in this dataset."""
        return [m for m in self.MEASURES if m in df.columns and df[m].notna().any() and df[m].nunique() > 1]

    def summary_stats(self, df):
        ms = self.measures(df)
        s = df[ms].describe().T
        s["skewness"] = df[ms].skew()
        return s.round(3).reset_index().rename(columns={"index": "measure"})

    def correlations(self, df):
        return df[self.measures(df)].corr().round(3)

    def distributions(self, df, column, bins=40):
        counts, edges = np.histogram(df[column].dropna(), bins=bins)
        return pd.DataFrame({"bin_start": edges[:-1], "bin_end": edges[1:], "count": counts})

    def category_comparison(self, df, by):
        g = df.groupby(by).agg(Sales=("Sales", "sum"), Profit=("Profit", "sum"), Avg_Discount=("Discount", "mean"),
                               Avg_Margin=("Profit_Margin", "mean"), Orders=("Order ID", "count")).reset_index()
        return g.round(4)
