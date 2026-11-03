"""DataStore: saves and loads data, results and reports (stores D1 to D5)."""
import json
from pathlib import Path
import pandas as pd


class DataStore:
    def __init__(self, base_path="."):
        self.base = Path(base_path)

    def _path(self, name):
        p = self.base / name
        p.parent.mkdir(parents=True, exist_ok=True)
        return p

    def save(self, name, obj):
        """Save a DataFrame (.parquet/.csv), dict or list (.json) or text (.txt/.log)."""
        p = self._path(name)
        if isinstance(obj, pd.DataFrame):
            if p.suffix == ".parquet":
                obj.to_parquet(p, index=False)
            else:
                obj.to_csv(p, index=False)
        elif isinstance(obj, (dict, list)):
            p.write_text(json.dumps(obj, indent=2, default=str), encoding="utf-8")
        else:
            p.write_text(str(obj), encoding="utf-8")
        return p

    def load(self, name):
        p = self._path(name)
        if not p.exists():
            return None
        if p.suffix == ".parquet":
            return pd.read_parquet(p)
        if p.suffix == ".csv":
            return pd.read_csv(p)
        if p.suffix == ".json":
            return json.loads(p.read_text(encoding="utf-8"))
        return p.read_text(encoding="utf-8")

    def exists(self, name):
        return (self.base / name).exists()
