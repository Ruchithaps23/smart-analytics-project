import Icon from "../../components/Icon";
import { DataTable, PageHeader, Panel, StatusBadge } from "../../components/ui";
import { ApiCapabilityNotice } from "./shared";

const engineFields = [
  { field: "Sales", requirement: "Required" },
  { field: "Sales Date", requirement: "Required" },
  { field: "Profit", requirement: "Optional" },
  { field: "Quantity", requirement: "Optional" },
  { field: "Category of Goods", requirement: "Optional" },
  { field: "Region", requirement: "Optional" },
];

const columns = [
  { key: "field", label: "AIML target field" },
  { key: "requirement", label: "Requirement", render: (row) => <StatusBadge tone={row.requirement === "Required" ? "pending" : "neutral"}>{row.requirement}</StatusBadge> },
  { key: "source", label: "Detected source column", render: () => <span className="mapping-unavailable"><Icon name="mapping"/> Not returned by API</span> },
];

export default function ColumnMappingPage() {
  return <div className="secondary-page column-mapping-page">
    <PageHeader eyebrow="DATA MANAGEMENT / SCHEMA" title="Column mapping" subtitle="Connect source columns to the business fields understood by the analysis engine." actions={<StatusBadge tone="preview" dot>Frontend preview</StatusBadge>} />
    <ApiCapabilityNotice icon="mapping" title="Mapping suggestions and edits are not connected to the React API.">
      The AIML engine contains column-suggestion and validation logic, but FastAPI has no route to return detected mappings or accept mapping changes. No mapping is being applied here.
    </ApiCapabilityNotice>

    <section className="mapping-workflow-rail"><div className="mapping-rail-step is-current"><span>01</span><div><strong>Source columns</strong><small>Unavailable</small></div></div><i/><div className="mapping-rail-step"><span>02</span><div><strong>Target fields</strong><small>Engine schema</small></div></div><i/><div className="mapping-rail-step"><span>03</span><div><strong>Confirm mapping</strong><small>Not connected</small></div></div></section>

    <Panel title="Mapping preview" subtitle="Target field names are taken from the AIML engine schema; source mapping values are not available." action={<StatusBadge tone="preview">Read-only preview</StatusBadge>} className="mapping-table-panel">
      <DataTable columns={columns} rows={engineFields} rowKey={(row) => row.field} />
      <div className="mapping-validation-note"><span className="mapping-note-icon">!</span><p><strong>Required fields:</strong> The engine schema requires Sales and Sales Date. This preview cannot check whether an uploaded file contains valid matching columns.</p></div>
    </Panel>

    <div className="mapping-footer-note"><span>Target schema preview</span><p>Mapping suggestions, field validation, and save actions will become available when the FastAPI integration exposes them.</p></div>
  </div>;
}
