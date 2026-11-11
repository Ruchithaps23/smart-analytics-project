import Icon from "../components/Icon";
import { DataTable, PageHeader, Panel, StatusBadge } from "../components/ui";

const reportTypes = [
  { name: "Executive Summary", detail: "Key business performance and decision highlights", icon: "dashboard", tone: "blue" },
  { name: "Data Quality Report", detail: "Completeness, validity, and schema findings", icon: "quality", tone: "teal" },
  { name: "Exploratory Data Analysis", detail: "Statistical profiles and feature exploration", icon: "exploratory", tone: "violet" },
  { name: "Sales Forecast Report", detail: "Forecast outputs and performance context", icon: "forecastChart", tone: "amber" },
  { name: "Profit Prediction Report", detail: "Prediction estimates and model evaluation", icon: "profit", tone: "green" },
  { name: "Anomaly Detection Report", detail: "Detected exceptions and associated risk", icon: "anomaly", tone: "rose" },
  { name: "Customer Segmentation Report", detail: "Segment profiles and business value", icon: "segments", tone: "indigo" },
];

const reportLibraryColumns = [
  { key: "name", label: "Report name" },
  { key: "category", label: "Category" },
  { key: "date", label: "Generated date" },
  { key: "format", label: "Format" },
  { key: "status", label: "Availability" },
];

const historyColumns = [
  { key: "report", label: "Report" },
  { key: "activity", label: "Activity" },
  { key: "date", label: "Date" },
  { key: "format", label: "Format" },
];

function ReportTypeCard({ report }) {
  return <article className={`report-type-card report-tone-${report.tone}`}><div className="report-type-top"><span className="report-document-icon"><Icon name={report.icon} /></span><StatusBadge tone="preview">Not generated</StatusBadge></div><h3>{report.name}</h3><p>{report.detail}</p><div className="report-type-foot"><span>Report template</span><span><Icon name="reports" /> Unavailable</span></div></article>;
}

export default function ReportsPage() {
  return (
    <div className="reports-page">
      <PageHeader eyebrow="REPORTS & DOWNLOADS" title="Report Centre" subtitle="A central workspace for business reporting, exports, and previously generated deliverables." actions={<StatusBadge tone="preview" dot>Report service unavailable</StatusBadge>} />

      <section className="reports-hero">
        <div className="reports-hero-copy"><span className="reports-hero-kicker"><Icon name="reports" /> REPORT MANAGEMENT</span><h2>Business intelligence,<br />ready to share.</h2><p>Organize analysis outputs and make decision-ready reports accessible to your team.</p><div className="reports-hero-status"><span className="reports-hero-status-icon"><Icon name="quality" /></span><div><strong>Report generation is not connected</strong><small>The current API does not provide report creation or download routes.</small></div></div></div>
        <div className="reports-hero-stack" aria-hidden="true"><div className="report-stack-sheet sheet-back"><i /><i /><i /></div><div className="report-stack-sheet sheet-middle"><i /><i /><i /><i /></div><div className="report-stack-sheet sheet-front"><span className="report-stack-logo"><Icon name="reports" /></span><i /><i /><i /></div><span className="report-stack-orbit" /></div>
      </section>

      <section className="report-category-section"><div className="report-section-heading"><div><span>REPORT CATEGORIES</span><h2>Explore report types</h2></div><StatusBadge tone="preview">Templates unavailable</StatusBadge></div><div className="report-category-grid">{reportTypes.map((report) => <ReportTypeCard key={report.name} report={report} />)}</div></section>

      <Panel className="report-library-panel" title="Report library" subtitle="Generated reports available to this workspace" action={<StatusBadge tone="preview">No generated reports</StatusBadge>}>
        <DataTable columns={reportLibraryColumns} rows={[]} showHeadersOnEmpty emptyMessage="No reports are available. The backend does not currently expose a report library or generated report metadata." />
      </Panel>

      <section className="report-preview-section"><div className="report-section-heading"><div><span>REPORT PREVIEWS</span><h2>Preview-ready layouts</h2></div><p>These cards describe report types only; no report files have been generated.</p></div><div className="report-preview-grid"><article className="report-preview-card"><div className="report-preview-cover cover-executive"><span className="report-preview-cover-icon"><Icon name="dashboard" /></span><i /><i /><i /><span className="report-preview-watermark">PREVIEW LAYOUT</span></div><div className="report-preview-info"><div><strong>Executive brief</strong><small>Executive Summary template</small></div><StatusBadge tone="preview">Unavailable</StatusBadge></div></article><article className="report-preview-card"><div className="report-preview-cover cover-analysis"><span className="report-preview-cover-icon"><Icon name="exploratory" /></span><i /><i /><i /><span className="report-preview-watermark">PREVIEW LAYOUT</span></div><div className="report-preview-info"><div><strong>Analysis dossier</strong><small>EDA report template</small></div><StatusBadge tone="preview">Unavailable</StatusBadge></div></article><article className="report-preview-card"><div className="report-preview-cover cover-forecast"><span className="report-preview-cover-icon"><Icon name="forecastChart" /></span><i /><i /><i /><span className="report-preview-watermark">PREVIEW LAYOUT</span></div><div className="report-preview-info"><div><strong>Forecast memo</strong><small>Sales forecast template</small></div><StatusBadge tone="preview">Unavailable</StatusBadge></div></article></div></section>

      <Panel className="report-history-panel" title="Download history" subtitle="Recent report downloads from this workspace" action={<span className="report-history-caption"><Icon name="reports" /> DOWNLOAD ACTIVITY</span>}>
        <DataTable columns={historyColumns} rows={[]} showHeadersOnEmpty emptyMessage="Download history is empty. Download activity is not returned by the current API." />
      </Panel>

      <aside className="reports-api-note"><span>i</span><p><strong>Preview state.</strong> Report categories and preview cards describe intended report types. The current FastAPI integration does not provide generated files, report metadata, formats, availability, or download history.</p></aside>
    </div>
  );
}
