"""M2  FeatureEngineer: derived fields, plus encoding and scaling helpers used by the models in later tasks."""
import pandas as pd


class FeatureEngineer:
    CATEGORICAL = ["Category of Goods", "Outlet Type", "City Type", "Segment", "Ship Mode", "Region", "State"]
    NUMERIC = ["Sales", "Quantity", "Discount", "Profit", "Profit_Margin", "Ship_Days", "Age"]

    def derive_age(self, df):
        df["Age"] = ((df["sales_date_dt"] - df["Date of Birth"]).dt.days / 365.25).round(1)
        return df

    def derive_time_fields(self, df):
        d = df["sales_date_dt"]
        df["Sales_Year"] = d.dt.year
        df["Month"] = d.dt.month
        df["Quarter"] = d.dt.quarter
        df["Year_Month"] = d.dt.to_period("M").astype(str)
        return df

    def derive_ship_days(self, df):
        df["Ship_Days"] = (df["Ship Date"] - df["Order Date"]).dt.days
        return df

    def derive_margin(self, df):
        df["Profit_Margin"] = (df["Profit"] / df["Sales"].where(df["Sales"] != 0)).round(4)
        return df

    def run(self, df):
        df = df.copy()
        for step in (self.derive_age, self.derive_time_fields, self.derive_ship_days, self.derive_margin):
            df = step(df)
        return df

    # ---- helpers for the model modules (Task 5) ----------------------------
    def encode(self, df, columns=None):
        return pd.get_dummies(df, columns=columns or self.CATEGORICAL, drop_first=False)

    def scale(self, df, columns=None):
        cols = columns or self.NUMERIC
        out = df.copy()
        out[cols] = (out[cols] - out[cols].mean()) / out[cols].std(ddof=0)
        return out
