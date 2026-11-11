import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../lib/api";
import { DataTable, EmptyState, Panel, StatusBadge } from "../../components/ui";
import { ApiCapabilityNotice, DataManagementHeader, DatasetMetric } from "./shared";

export default function DatasetLibraryPage() {
  const [service, setService] = useState({ loading: true, health: null, summary: null, error: "" });
  useEffect(() => {
    let active = true;
    Promise.all([fetch(`${API_BASE_URL}/api/health`), fetch(`${API_BASE_URL}/api/summary`)])
      .then(async ([healthResponse, summaryResponse]) => {
        if (!healthResponse.ok || !summaryResponse.ok) throw new Error("Could not read service status.");
        const [health, summary] = await Promise.all([healthResponse.json(), summaryResponse.json()]);
        if (active) setService({ loading: false, health, summary, error: "" });
      })
      .catch((error) => { if (active) setService({ loading: false, health: null, summary: null, error: error.message }); });
    return () => { active = false; };
  }, []);

  const modules = service.summary?.modules ? Object.entries(service.summary.modules) : [];
  const columns = [
    { key: "filename", label: "Dataset" },
    { key: "uploaded", label: "Uploaded" },
    { key: "rows", label: "Records", numeric: true },
    { key: "status", label: "Status" },
    { key: "actions", label: "Available actions" },
  ];

  return <div className="secondary-page dataset-library-page">
    <DataManagementHeader title="Dataset library" subtitle="A home for connected business datasets, source details, and availability." />
    <ApiCapabilityNotice title="This library is a frontend preview. The current API does not list uploaded datasets.">
      Filename, upload date, record count, status, and file actions are not returned by FastAPI. No placeholder datasets are shown.
    </ApiCapabilityNotice>

    <section className="dataset-metrics-row" aria-label="Dataset library availability">
      <DatasetMetric label="Dataset records" value="Not provided" note="No dataset list response" />
      <DatasetMetric label="Upload history" value="Not provided" note="No upload metadata route" />
      <DatasetMetric label="API connection" value={service.loading ? "Checking" : service.health?.status === "healthy" ? "Healthy" : "Unavailable"} note={service.error || "Status from /api/health"} />
    </section>

    <Panel title="Available datasets" subtitle="Dataset rows will appear here when a listing API is available." action={<StatusBadge tone="preview">Preview table</StatusBadge>} className="dataset-library-panel">
      <DataTable columns={columns} rows={[]} showHeadersOnEmpty emptyMessage="There are no dataset records available from the current API." />
    </Panel>

    <Panel title="Platform processing modules" subtitle="Global module states returned by /api/summary. These do not describe a specific dataset or upload." action={<StatusBadge tone={service.summary ? "live" : "pending"} dot>{service.loading ? "Loading" : service.summary ? "Live API response" : "Unavailable"}</StatusBadge>}>
      {service.loading ? <div className="dataset-module-loading">Reading the service summary…</div> : modules.length ? <div className="dataset-module-list">{modules.map(([name, value]) => <div key={name}><span className={`dataset-module-dot ${["completed", "running"].includes(String(value).toLowerCase()) ? "is-ready" : ""}`} /><span>{name.replaceAll("_", " ")}</span><strong>{String(value)}</strong></div>)}</div> : <EmptyState title="No module status received" message={service.error || "The summary response did not include module values."} />}
    </Panel>
  </div>;
}
