"""Command-line runner: python run_pipeline.py [path/to/file.csv]"""
import sys
from src.pipeline import PipelineController
from src.kpi import KPIEngine

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else None
    ctl = PipelineController()
    df, status = ctl.run_pipeline(src)
    print("\n=== PIPELINE LOG ===")
    for s in status["steps"]:
        print(" -", s)
    print("\n=== DATA-QUALITY REPORT ===")
    print(status["report"].to_text())
    print("\n=== OVERALL KPIs ===")
    for k, v in KPIEngine().totals(df).items():
        print(f" {k:>20}: {v:,.2f}")
    print("\nProcessed data saved to data/processed/clean_sales.parquet")
