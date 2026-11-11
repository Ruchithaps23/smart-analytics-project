"""REST API for the Smart Analytics pipeline.

Run from the project directory with:
    uvicorn api.main:app --reload
"""
from __future__ import annotations

import json
import logging
import math
import threading
import uuid
from datetime import date, datetime
from pathlib import Path
from typing import Any

import pandas as pd
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from .engine.kpi import KPIEngine
from .engine.pipeline import PipelineController, load_config


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_ROOT = PROJECT_ROOT / "backend_data"
MAX_UPLOAD_BYTES = 100 * 1024 * 1024
ALLOWED_SUFFIXES = {".csv", ".xlsx", ".xls"}
PRIVATE_FIELDS = set(load_config()["private_columns"])

app = FastAPI(
    title="Smart Analytics API",
    description="Upload sales data, run the analytics pipeline, and retrieve business insights.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

_jobs: dict[str, dict[str, Any]] = {}
_lock = threading.RLock()


def _jsonable(value: Any) -> Any:
    """Convert pandas/numpy values into strict JSON values."""
    if isinstance(value, dict):
        return {str(k): _jsonable(v) for k, v in value.items()}
    if isinstance(value, (list, tuple)):
        return [_jsonable(v) for v in value]
    if isinstance(value, pd.DataFrame):
        return _jsonable(value.to_dict(orient="records"))
    if isinstance(value, pd.Series):
        return _jsonable(value.tolist())
    if hasattr(value, "item"):
        try:
            value = value.item()
        except (ValueError, TypeError):
            pass
    if value is None or isinstance(value, (str, int, bool)):
        return value
    if isinstance(value, (datetime, date, pd.Timestamp)):
        return value.isoformat()
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if pd.isna(value):
        return None
    return str(value)


def _job_or_404(dataset_id: str) -> dict[str, Any]:
    with _lock:
        job = _jobs.get(dataset_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Dataset not found")
    return job


def _load_frame(dataset_id: str) -> pd.DataFrame:
    job = _job_or_404(dataset_id)
    if job["status"] != "completed":
        raise HTTPException(status_code=409, detail=f"Analysis is {job['status']}")
    frame_path = DATA_ROOT / dataset_id / "data" / "processed" / "clean_sales.parquet"
    scored_path = DATA_ROOT / dataset_id / "results" / "scored_records.parquet"
    if frame_path.exists():
        frame = pd.read_parquet(frame_path)
        if scored_path.exists():
            scored = pd.read_parquet(scored_path)
            keys = [c for c in ("Order ID",) if c in frame and c in scored]
            if keys:
                frame = frame.merge(scored, on=keys, how="left", suffixes=("", "_score"))
        return frame
    raise HTTPException(status_code=500, detail="Processed dataset is missing")


def _run_job(dataset_id: str, filename: str, mapping: dict[str, str] | None) -> None:
    root = DATA_ROOT / dataset_id
    upload_path = root / "upload" / filename
    with _lock:
        _jobs[dataset_id]["status"] = "running"
    try:
        controller = PipelineController(base_path=root)
        frame, status = controller.run_pipeline(upload_path, filename, mapping=mapping)
        summary = {
            "rows_in": status["rows_in"],
            "rows_out": status["rows_out"],
            "mapping": status["mapping"],
            "caps": status["caps"],
            "notes": status["notes"],
            "steps": status["steps"],
            "quality": status["report"].to_dict(),
            "kpis": KPIEngine().totals(frame),
            "analytics": status["analytics"],
            "columns": [c for c in frame.columns if c not in PRIVATE_FIELDS],
        }
        with _lock:
            _jobs[dataset_id].update(status="completed", result=_jsonable(summary), completed_at=datetime.now().astimezone().isoformat())
    except Exception as exc:
        logging.exception("Analysis job %s failed", dataset_id)
        with _lock:
            _jobs[dataset_id].update(status="failed", error=str(exc), completed_at=datetime.now().astimezone().isoformat())


@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "smart-analytics-api"}


@app.post("/api/v1/datasets", status_code=202)
async def create_dataset(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    mapping: str | None = Form(default=None),
) -> dict[str, Any]:
    """Upload CSV/Excel data and start pipeline analysis in the background.

    `mapping`, when supplied, is a JSON object from canonical field names to
    uploaded column names (for example `{"Sales":"Revenue","Sales Date":"Txn Date"}`).
    """
    filename = Path(file.filename or "").name
    suffix = Path(filename).suffix.lower()
    if not filename or suffix not in ALLOWED_SUFFIXES:
        raise HTTPException(status_code=400, detail="Upload a CSV, XLSX, or XLS file")
    try:
        parsed_mapping = json.loads(mapping) if mapping else None
        if parsed_mapping is not None and (not isinstance(parsed_mapping, dict) or not all(isinstance(k, str) and isinstance(v, str) for k, v in parsed_mapping.items())):
            raise ValueError
    except (json.JSONDecodeError, ValueError):
        raise HTTPException(status_code=400, detail="mapping must be a JSON object of field names to column names")

    payload = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if not payload:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")
    if len(payload) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Maximum upload size is 100 MB")

    dataset_id = uuid.uuid4().hex
    upload_dir = DATA_ROOT / dataset_id / "upload"
    upload_dir.mkdir(parents=True, exist_ok=False)
    (upload_dir / filename).write_bytes(payload)
    with _lock:
        _jobs[dataset_id] = {
            "dataset_id": dataset_id,
            "filename": filename,
            "status": "queued",
            "created_at": datetime.now().astimezone().isoformat(),
        }
    background_tasks.add_task(_run_job, dataset_id, filename, parsed_mapping)
    return {"dataset_id": dataset_id, "status": "queued", "status_url": f"/api/v1/datasets/{dataset_id}"}


@app.get("/api/v1/datasets")
def list_datasets() -> dict[str, Any]:
    with _lock:
        items = [{k: v for k, v in job.items() if k not in ("result", "error")} for job in _jobs.values()]
    return {"datasets": items}


@app.get("/api/v1/datasets/{dataset_id}")
def dataset_status(dataset_id: str) -> dict[str, Any]:
    job = _job_or_404(dataset_id)
    response = {k: v for k, v in job.items() if k != "result"}
    if job["status"] == "completed":
        response["result"] = job["result"]
    return response


@app.get("/api/v1/datasets/{dataset_id}/kpis")
def get_kpis(dataset_id: str) -> dict[str, Any]:
    frame = _load_frame(dataset_id)
    return _jsonable(KPIEngine().totals(frame))


@app.get("/api/v1/datasets/{dataset_id}/trend")
def get_trend(dataset_id: str, period: str = "Year_Month") -> dict[str, Any]:
    frame = _load_frame(dataset_id)
    if period not in {"Year_Month", "Sales_Year", "Quarter"}:
        raise HTTPException(status_code=400, detail="period must be Year_Month, Sales_Year, or Quarter")
    if period not in frame:
        raise HTTPException(status_code=422, detail=f"Period {period} is unavailable")
    trend = frame.groupby(period).agg(Sales=("Sales", "sum"), Profit=("Profit", "sum")).reset_index().sort_values(period)
    return {"period": period, "items": _jsonable(trend)}


@app.get("/api/v1/datasets/{dataset_id}/groups/{dimension}")
def get_group_kpis(dataset_id: str, dimension: str) -> dict[str, Any]:
    frame = _load_frame(dataset_id)
    allowed = {"Category of Goods", "Sub-Category", "Region", "State", "Segment", "Outlet Type", "City Type", "Ship Mode", "Sales_Year"}
    if dimension not in allowed:
        raise HTTPException(status_code=400, detail=f"dimension must be one of: {', '.join(sorted(allowed))}")
    if dimension not in frame:
        raise HTTPException(status_code=422, detail=f"Dimension {dimension} is unavailable")
    return {"dimension": dimension, "items": _jsonable(KPIEngine().compute_kpis(frame, dimension))}


@app.get("/api/v1/datasets/{dataset_id}/records")
def get_records(dataset_id: str, limit: int = 100, offset: int = 0, anomalies_only: bool = False) -> dict[str, Any]:
    if limit < 1 or limit > 1000 or offset < 0:
        raise HTTPException(status_code=400, detail="limit must be 1–1000 and offset must be non-negative")
    frame = _load_frame(dataset_id)
    if anomalies_only:
        if "anomaly_flag" not in frame:
            raise HTTPException(status_code=422, detail="Anomaly analysis is unavailable")
        frame = frame[frame["anomaly_flag"].fillna(False)]
    frame = frame.drop(columns=[c for c in PRIVATE_FIELDS if c in frame], errors="ignore")
    return {"total": int(len(frame)), "limit": limit, "offset": offset,
            "items": _jsonable(frame.iloc[offset:offset + limit])}


@app.get("/api/v1/datasets/{dataset_id}/reports/{name}")
def download_report(dataset_id: str, name: str) -> FileResponse:
    _job_or_404(dataset_id)
    if name not in {"quality", "cleaning", "pipeline"}:
        raise HTTPException(status_code=404, detail="Report not found")
    file_map = {
        "quality": "logs/quality_report.json",
        "cleaning": "logs/cleaning_log.json",
        "pipeline": "logs/pipeline.log",
    }
    path = DATA_ROOT / dataset_id / file_map[name]
    if not path.exists():
        raise HTTPException(status_code=409, detail="Report is not ready")
    return FileResponse(path, filename=path.name)
