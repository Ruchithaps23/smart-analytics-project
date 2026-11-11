import Icon from "../components/Icon";
import { DataTable, PageHeader, Panel, StatusBadge } from "../components/ui";

const qualityDimensions = [
  { name: "Completeness", detail: "Presence of required values", icon: "preview", tone: "blue" },
  { name: "Consistency", detail: "Agreement across related fields", icon: "mapping", tone: "teal" },
  { name: "Validity", detail: "Values conform to expected rules", icon: "quality", tone: "violet" },
  { name: "Uniqueness", detail: "Duplicate record assessment", icon: "datasets", tone: "amber" },
];

const issueColumns = [
  { key: "category", label: "Issue category" },
  { key: "field", label: "Field" },
  { key: "severity", label: "Severity" },
  { key: "records", label: "Affected records", numeric: true },
  { key: "status", label: "Status" },
];

function UnavailableState({ icon = "quality", title, children }) {
  return (
    <div className="quality-unavailable">
      <span className="quality-unavailable-icon"><Icon name={icon} /></span>
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}

function QualityDimensionCard({ item }) {
  return (
    <article className={`quality-dimension-card quality-tone-${item.tone}`}>
      <div className="quality-dimension-top">
        <span className="quality-dimension-icon"><Icon name={item.icon} /></span>
        <StatusBadge tone="preview">No results</StatusBadge>
      </div>
      <h3>{item.name}</h3>
      <p>{item.detail}</p>
      <div className="quality-score-placeholder" aria-label={`${item.name} score unavailable`}><span>—</span><small>Score unavailable</small></div>
    </article>
  );
}

export default function DataQualityPage() {
  return (
    <div className="quality-page">
      <PageHeader
        eyebrow="DATA INTELLIGENCE"
        title="Data quality"
        subtitle="Assess the reliability, structure, and readiness of your business data."
        actions={<StatusBadge tone="preview" dot>Preview · results not connected</StatusBadge>}
      />

      <section className="quality-overview-banner">
        <div className="quality-overview-copy">
          <span className="quality-overview-label"><Icon name="quality" /> QUALITY OVERVIEW</span>
          <h2>Build confidence in every decision.</h2>
          <p>Quality checks will appear here when analysis results are available from the connected service.</p>
          <div className="quality-overview-meta"><span className="quality-meta-dot" /> Analysis results not connected</div>
        </div>
        <div className="quality-overview-score" aria-label="Overall quality score unavailable">
          <div className="quality-score-ring"><span>—</span></div>
          <strong>Overall score</strong>
          <small>Unavailable</small>
        </div>
        <div className="quality-overview-decoration" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </section>

      <section className="quality-dimension-section" aria-labelledby="quality-dimensions-heading">
        <div className="quality-section-heading"><div><span>QUALITY DIMENSIONS</span><h2 id="quality-dimensions-heading">Quality scorecard</h2></div><StatusBadge tone="pending">Awaiting analysis</StatusBadge></div>
        <div className="quality-dimension-grid">{qualityDimensions.map((item) => <QualityDimensionCard key={item.name} item={item} />)}</div>
      </section>

      <div className="quality-analysis-grid">
        <Panel title="Validation summary" subtitle="Rule checks and validation outcomes">
          <UnavailableState title="Validation results are not available">The current React API does not return validation checks or their outcomes.</UnavailableState>
        </Panel>
        <Panel title="Missing values" subtitle="Completeness by field">
          <UnavailableState icon="analytics" title="Missing-value analysis is not connected">No field-level missing-value counts are available to display.</UnavailableState>
        </Panel>
        <Panel title="Duplicate records" subtitle="Uniqueness assessment">
          <UnavailableState icon="datasets" title="Duplicate analysis is not connected">No duplicate detection results or affected-record counts were returned.</UnavailableState>
        </Panel>
      </div>

      <Panel className="quality-schema-panel" title="Data types & schema validation" subtitle="Detected columns, expected types, and schema checks">
        <div className="quality-schema-callout"><span><Icon name="mapping" /></span><div><strong>Schema results are unavailable</strong><p>The connected API does not provide detected column types or schema validation results.</p></div><StatusBadge tone="preview">Not connected</StatusBadge></div>
        <div className="quality-schema-columns" aria-hidden="true"><span>Column</span><span>Detected type</span><span>Expected type</span><span>Validation</span></div>
        <div className="quality-schema-empty"><span>Schema details will appear after analysis results are connected.</span></div>
      </Panel>

      <Panel className="quality-issues-panel" title="Data quality issues" subtitle="Review findings by category and severity" action={<StatusBadge tone="preview">No live findings</StatusBadge>}>
        <DataTable columns={issueColumns} rows={[]} showHeadersOnEmpty emptyMessage="Issue records are not available because data quality results are not connected to the frontend." />
      </Panel>

      <aside className="quality-integration-note"><span>i</span><p><strong>Preview state.</strong> The current FastAPI frontend integration does not expose data quality analysis results. Scores, findings, and validation status will remain unavailable until an API response supplies them.</p></aside>
    </div>
  );
}
