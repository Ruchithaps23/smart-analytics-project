"""M1  DataIngestor: loads the dataset (CSV or Excel), validates the format and reads the schema."""
from pathlib import Path
import pandas as pd


class DataIngestor:
    def __init__(self, expected_columns=None):
        """expected_columns is optional. When given, validate_format() checks them (strict mode);
        otherwise any columns are accepted and the column mapping (src/schema.py) decides what is usable."""
        self.expected_columns = list(expected_columns) if expected_columns else []
        self.schema = {}

    def load_file(self, source, filename=None):
        """Load CSV or Excel from a path or an uploaded file object."""
        name = filename or (source if isinstance(source, (str, Path)) else getattr(source, "name", ""))
        suffix = Path(str(name)).suffix.lower()
        if suffix == ".csv":
            df = self._read_csv(source)
        elif suffix in (".xlsx", ".xls"):
            df = pd.read_excel(source)
        else:
            raise ValueError(f"Unsupported file type '{suffix}'. Upload a CSV or Excel file.")
        if df.empty:
            raise ValueError("The file contains no rows.")
        df.columns = [str(c).strip() for c in df.columns]
        self.read_schema(df)
        if self.expected_columns:
            self.validate_format(df)
        return df

    @staticmethod
    def _read_csv(source):
        last = None
        for enc in ("utf-8", "utf-8-sig", "latin1"):
            try:
                if hasattr(source, "seek"):
                    source.seek(0)
                return pd.read_csv(source, encoding=enc, sep=None, engine="python")
            except (UnicodeDecodeError, pd.errors.ParserError) as e:
                last = e
        raise ValueError(f"The CSV file could not be read ({last}).")

    def read_schema(self, df):
        self.schema = {c: str(t) for c, t in df.dtypes.items()}
        return self.schema

    def validate_format(self, df):
        missing = [c for c in self.expected_columns if c not in df.columns]
        if missing:
            raise ValueError("Schema check failed. Missing columns: " + ", ".join(missing))
        return True
