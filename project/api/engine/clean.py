"""M2  DataCleaner: casts types, standardises dates, flags inconsistencies (flags, does not drop, records)."""
import pandas as pd


class DataCleaner:
    def __init__(self, config, caps=None):
        self.cfg = config
        self.caps = caps or {}
        self.log = []

    def has(self, key):
        return self.caps.get(key, True)

    def cast_types(self, df):
        df = df.copy()
        for c in self.cfg["date_columns"]:
            if c in df.columns:
                df[c] = pd.to_datetime(df[c], errors="coerce")
        for c in self.cfg["text_columns"]:
            if c in df.columns:
                df[c] = df[c].astype(str)
        self.log.append("Cast date columns to datetime and Postal Code to text")
        return df

    def remove_duplicates(self, df):
        before = len(df)
        df = df.drop_duplicates()
        if self.has("order_id"):
            df = df.drop_duplicates(subset="Order ID")
        self.log.append(f"Removed {before - len(df)} duplicate records")
        return df

    def handle_missing(self, df):
        n = int(df.isna().sum().sum())
        df = df.copy()
        before = len(df)
        df = df.dropna(subset=["Sales", "Sales Date"])
        num = [c for c in df.select_dtypes("number").columns if df[c].notna().any()]
        df[num] = df[num].fillna(df[num].median())
        self.log.append(f"Handled missing values: {n} empty cells; numeric gaps filled with the median; "
                        f"{before - len(df)} rows without Sales or Sales Date dropped")
        return df

    def standardise_dates(self, df):
        """Sales Date is the authoritative date (decision from the Task 1 data analysis)."""
        df = df.copy()
        df["sales_date_dt"] = df[self.cfg["rules"]["authoritative_date"]]
        self.log.append("Created sales_date_dt from Sales Date (authoritative date)")
        return df

    def flag_inconsistencies(self, df):
        df = df.copy()
        df["date_conflict_flag"] = (df["Sales Date"] < df["Order Date"]) if self.has("order_date") else False
        exp = df["State"].map(self.cfg["state_region"])
        df["region_state_flag"] = (exp.notna() & (exp != df["Region"])) if (self.has("region") and self.has("state")) else False
        age = (df["sales_date_dt"] - df["Date of Birth"]).dt.days / 365.25
        df["minor_flag"] = (age < self.cfg["rules"]["min_adult_age"]) if self.has("dob") else False
        self.log.append(
            f"Flagged {int(df.date_conflict_flag.sum())} date conflicts, "
            f"{int(df.region_state_flag.sum())} Region/State mismatches, {int(df.minor_flag.sum())} minors")
        return df

    def run(self, df):
        self.log = []
        df = self.cast_types(df)
        df = self.remove_duplicates(df)
        df = self.handle_missing(df)
        df = self.standardise_dates(df)
        df = self.flag_inconsistencies(df)
        return df
