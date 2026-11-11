import Icon from "../../components/Icon";
import { DataTable, PageHeader, Panel, StatusBadge } from "../../components/ui";
import { ApiCapabilityNotice, DatasetMetric } from "./shared";

const previewColumns = [
  { key: "column", label: "Source column" },
  { key: "type", label: "Detected type" },
  { key: "sample", label: "Sample value" },
  { key: "mapping", label: "Mapped field" },
];

export default function DatasetPreviewPage() {
  return <div className="secondary-page dataset-preview-page">
    <PageHeader eyebrow="DATA MANAGEMENT / INSPECTION" title="Dataset preview" subtitle="Review a dataset's structure and sample rows before analysis." actions={<StatusBadge tone="preview" dot>Frontend preview</StatusBadge>} />
    <ApiCapabilityNotice icon="preview" title="No dataset preview response is available from FastAPI.">
      The API does not return a selected filename, columns, record count, sample rows, or paginated records. This page intentionally contains no example records.
    </ApiCapabilityNotice>

    <section className="dataset-preview-metrics"><DatasetMetric label="Selected dataset" value="Unavailable" note="No dataset selection API"/><DatasetMetric label="Total records" value="Unavailable" note="No row-count response"/><DatasetMetric label="Columns" value="Unavailable" note="No schema response"/><DatasetMetric label="Preview rows" value="Unavailable" note="No preview endpoint"/></section>

    <Panel title="Source structure" subtitle="Column names and field types will be shown when the API returns dataset metadata." className="dataset-structure-panel" action={<StatusBadge tone="preview">No source loaded</StatusBadge>}>
      <DataTable columns={previewColumns} rows={[]} showHeadersOnEmpty emptyMessage="Source columns are not available. Connect a dataset metadata and preview endpoint to populate this table." />
    </Panel>

    <Panel title="Record preview" subtitle="A paginated view of source rows will appear here after a dataset is selected." className="record-preview-panel" action={<span className="preview-pagination-label">Pagination unavailable</span>}>
      <div className="record-preview-empty"><span><Icon name="preview" /></span><strong>No record preview</strong><p>The frontend will render rows returned by the API. It does not generate or substitute example data.</p></div>
    </Panel>
  </div>;
}
