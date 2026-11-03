"""M1  DataIngestor: loads the dataset, validates format and reads the schema."""
from pathlib import Path
import pandas as pd


class DataIngestor:
    def __init__(self, expected_columns):
        self.expected_columns = list(expected_columns)
        self.schema = {}

    def load_file(self, source, filename=None):
        """Load CSV or Excel from a path or an uploaded file object."""
        name = filename or (source if isinstance(source, (str, Path)) else getattr(source, "name", ""))
        suffix = Path(str(name)).suffix.lower()
        if suffix == ".csv":
            df = pd.read_csv(source)
        elif suffix in (".xlsx", ".xls"):
            df = pd.read_excel(source)
        else:
            raise ValueError(f"Unsupported file type '{suffix}'. Upload a CSV or Excel file.")
        if df.empty:
            raise ValueError("The file contains no rows.")
        self.read_schema(df)
        self.validate_format(df)
        return df

    def read_schema(self, df):
        self.schema = {c: str(t) for c, t in df.dtypes.items()}
        return self.schema

    def validate_format(self, df):
        missing = [c for c in self.expected_columns if c not in df.columns]
        if missing:
            raise ValueError("Schema check failed. Missing columns: " + ", ".join(missing))
        return True
