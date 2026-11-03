# Smart Data Analytics and Digital Intelligence System for Business Decision-Making

REVA University RIO project (Tasks 1 to 7). This folder holds the **Task 4 core implementation (about 30%)**:
M1 Data Ingestion and Validation, M2 Cleaning and Feature Engineering, M3 EDA and KPI, the PipelineController,
the DataStore, and a Streamlit dashboard with three pages (Overview, Data Quality, EDA).
Modules M4 (forecasting, profit prediction), M5 (anomalies, segments) and the report export of M6 follow in Task 5.

## Setup
```
python -m venv venv
venv\Scripts\activate          # Windows   (Linux/Mac: source venv/bin/activate)
pip install -r requirements.txt
```
The dataset is already at `data/raw/store_sales_data.csv`.

## Run
```
python run_pipeline.py          # runs M1 -> M2 -> M3 and prints log, quality report and KPIs
streamlit run app.py            # opens the dashboard in the browser
python -m pytest -q tests       # unit tests
```
You can also upload a different CSV or Excel file with the same 25 columns in the dashboard sidebar.

## Structure (matches the Task 2 design)
```
app.py                  M6 dashboard (Overview, Data Quality, EDA)
run_pipeline.py         command-line runner
config.yaml             paths, rules, state-region mapping, private columns
src/
  pipeline.py           PipelineController (orchestration, logging)
  ingest.py             M1 DataIngestor
  quality.py            M1 DataQualityChecker, QualityReport
  clean.py              M2 DataCleaner
  features.py           M2 FeatureEngineer
  eda.py, kpi.py        M3 EDAEngine, KPIEngine
  store.py              DataStore (D1 to D5)
data/raw  data/processed  models/  results/  logs/  tests/
```

## Data stores written by the pipeline
| Store | File |
|---|---|
| D1 Raw | data/raw/validated_raw.parquet |
| D2 Processed | data/processed/clean_sales.parquet |
| D4 Results | results/kpi_*.csv/json, eda_*.csv |
| D5 Logs | logs/pipeline.log, quality_report.json, cleaning_log.json |

## Key design decisions
- Sales Date is the authoritative date (Order Date conflicts with it in about 50% of rows); Year is recomputed as `Sales_Year`.
- Inconsistent records are flagged (`date_conflict_flag`, `region_state_flag`, `minor_flag`), not deleted.
- The Region/State mapping in `config.yaml` is editable (Madhya Pradesh is mapped to West by assumption).
- Customer names and dates of birth are never displayed in the dashboard.
