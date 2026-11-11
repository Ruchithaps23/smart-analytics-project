# Smart Analytics REST API

This API exposes the analytics pipeline to a web or mobile frontend. Its engine modules and configuration are bundled under `api/engine` and `api/config.yaml`, so it runs independently of the existing project pipeline files.

## Install and run

From the `project` directory, install the API requirements:

```powershell
python -m pip install -r api/requirements.txt
uvicorn api.main:app --reload
```

Open `http://127.0.0.1:8000/docs` for interactive API documentation. The service listens on localhost by default. For a deployed service, configure the host, allowed CORS origins, upload limits, and authentication for the intended environment.

## Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/health` | Health check |
| POST | `/api/v1/datasets` | Upload CSV/XLSX/XLS and start analysis; returns HTTP 202 and a dataset ID |
| GET | `/api/v1/datasets` | List dataset jobs held by this process |
| GET | `/api/v1/datasets/{id}` | Poll job state and get the completed summary |
| GET | `/api/v1/datasets/{id}/kpis` | Overall KPIs |
| GET | `/api/v1/datasets/{id}/trend?period=Year_Month` | Sales and profit over time |
| GET | `/api/v1/datasets/{id}/groups/{dimension}` | KPI breakdown by an allowed dimension |
| GET | `/api/v1/datasets/{id}/records?limit=100&offset=0` | Paginated records (private name and DOB fields are excluded) |
| GET | `/api/v1/datasets/{id}/records?anomalies_only=true` | Paginated flagged records |
| GET | `/api/v1/datasets/{id}/reports/{quality\|cleaning\|pipeline}` | Download a processing report |

Uploads are capped at 100 MB. Mapping can be provided as a multipart form field containing a JSON object, for example:

```json
{"Sales":"Revenue","Sales Date":"Txn Date"}
```

If no mapping is provided, the project's existing column mapper is used. Each upload's pipeline artifacts are isolated under `backend_data/{dataset_id}`. Job metadata is held in process memory, so restarting the API clears the job list; persisted files remain on disk.
