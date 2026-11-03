"""M3  EDAEngine: descriptive statistics, correlations and distributions."""
import numpy as np
import pandas as pd


class EDAEngine:
    MEASURES = ["Sales", "Profit", "Quantity", "Discount", "Profit_Margin", "Ship_Days", "Age"]

    def summary_stats(self, df):
        s = df[self.MEASURES].describe().T
        s["skewness"] = df[self.MEASURES].skew()
        return s.round(3).reset_index().rename(columns={"index": "measure"})

    def correlations(self, df):
        return df[self.MEASURES].corr().round(3)

    def distributions(self, df, column, bins=40):
        counts, edges = np.histogram(df[column].dropna(), bins=bins)
        return pd.DataFrame({"bin_start": edges[:-1], "bin_end": edges[1:], "count": counts})

    def category_comparison(self, df, by):
        g = df.groupby(by).agg(Sales=("Sales", "sum"), Profit=("Profit", "sum"), Avg_Discount=("Discount", "mean"),
                               Avg_Margin=("Profit_Margin", "mean"), Orders=("Order ID", "count")).reset_index()
        return g.round(4)
