import Icon from "../components/Icon";
import { DataTable, PageHeader, Panel, StatusBadge } from "../components/ui";

const anomalyMetrics = [
  { label: "Total anomalies", icon: "anomaly", color: "blue", note: "Detection results" },
  { label: "Critical anomalies", icon: "alerts", color: "red", note: "Highest severity" },
  { label: "Anomaly rate", icon: "analytics", color: "teal", note: "Share of analyzed records" },
  { label: "Affected records", icon: "datasets", color: "violet", note: "Unique impacted entities" },
];

const severityLevels = [
  { name: "Critical", tone: "critical" },
  { name: "High", tone: "high" },
  { name: "Medium", tone: "medium" },
  { name: "Low", tone: "low" },
];

const anomalyColumns = [
  { key: "type", label: "Anomaly type" },
  { key: "entity", label: "Affected entity" },
  { key: "severity", label: "Severity" },
  { key: "date", label: "Detection date" },
  { key: "status", label: "Status" },
];

function AnomalyMetric({ item }) {
  return <article className={`anomaly-metric anomaly-metric-${item.color}`}><div className="anomaly-metric-head"><span>{item.label}</span><i><Icon name={item.icon} /></i></div><strong>—</strong><small>{item.note} unavailable</small></article>;
}

function MonitoringEmpty({ icon, title, description, variant = "default" }) {
  return <div className={`anomaly-empty anomaly-empty-${variant}`}><span className="anomaly-empty-icon"><Icon name={icon} /></span><strong>{title}</strong><p>{description}</p></div>;
}

export default function AnomalyDetectionPage() {
  return (
    <div className="anomaly-page">
      <PageHeader eyebrow="PREDICTIVE ANALYTICS" title="Anomaly detection" subtitle="Monitor unusual patterns and investigate emerging business risk signals." actions={<StatusBadge tone="preview" dot>Results not connected</StatusBadge>} />

      <section className="anomaly-hero">
        <div className="anomaly-hero-copy"><span className="anomaly-hero-kicker"><i /> RISK INTELLIGENCE</span><h2>See unexpected patterns<br />before they become risk.</h2><p>A focused monitoring workspace for anomalies detected across your business data.</p><div className="anomaly-live-state"><span className="anomaly-state-symbol"><Icon name="anomaly" /></span><div><strong>Detection feed unavailable</strong><small>Analysis results are not exposed by the current API.</small></div></div></div>
        <div className="anomaly-radar" aria-hidden="true"><div className="radar-ring radar-ring-outer" /><div className="radar-ring radar-ring-middle" /><div className="radar-ring radar-ring-inner" /><div className="radar-sweep" /><span className="radar-center"><Icon name="quality" /></span><i className="radar-point radar-point-a" /><i className="radar-point radar-point-b" /></div>
        <div className="anomaly-hero-foot"><span>MONITORING STATUS</span><StatusBadge tone="preview" dot>Awaiting connected analysis</StatusBadge></div>
      </section>

      <section className="anomaly-metric-grid" aria-label="Anomaly metrics">{anomalyMetrics.map((item) => <AnomalyMetric item={item} key={item.label} />)}</section>

      <section className="anomaly-visual-grid">
        <Panel className="anomaly-distribution-panel" title="Anomaly distribution" subtitle="Detected patterns across anomaly categories" action={<span className="anomaly-panel-label">CATEGORY VIEW</span>}>
          <MonitoringEmpty icon="analytics" title="Distribution unavailable" description="Category-level anomaly results will appear here when analysis data is connected." variant="chart" />
        </Panel>
        <Panel className="anomaly-severity-panel" title="Severity breakdown" subtitle="Incidents grouped by assessed severity">
          <div className="anomaly-severity-list">{severityLevels.map((level) => <div className={`anomaly-severity-row severity-${level.tone}`} key={level.name}><span className="severity-indicator" /><strong>{level.name}</strong><span className="severity-value">Unavailable</span></div>)}</div>
          <p className="anomaly-source-note">Severity counts are unavailable until results are returned by the analysis API.</p>
        </Panel>
      </section>

      <Panel className="anomaly-trend-panel" title="Detection trends" subtitle="Anomaly volume over time" action={<StatusBadge tone="preview">No time series</StatusBadge>}>
        <MonitoringEmpty icon="forecastChart" title="Trend data is not connected" description="No detection dates or time-series counts are available to plot." variant="trend" />
      </Panel>

      <Panel className="anomaly-table-panel" title="Detected anomalies" subtitle="Review findings by type, entity, severity, and status" action={<span className="anomaly-panel-label">LIVE FINDINGS</span>}>
        <DataTable columns={anomalyColumns} rows={[]} showHeadersOnEmpty emptyMessage="No anomaly records are available from the current API." />
      </Panel>

      <section className="anomaly-decision-grid">
        <Panel title="Risk insights" subtitle="Context generated from detected patterns">
          <MonitoringEmpty icon="exploratory" title="Risk insights will appear here" description="There are no connected anomaly findings to interpret." />
        </Panel>
        <Panel title="Recommended actions" subtitle="Next steps informed by actual detection evidence">
          <MonitoringEmpty icon="recommendations" title="Actions are not available" description="The current API does not return anomaly-based recommendations." />
        </Panel>
      </section>

      <aside className="anomaly-integration-note"><span>i</span><p><strong>Preview state.</strong> The AIML pipeline's anomaly outputs are not available through the existing React API integration. All metrics, visualizations, findings, and actions will remain unavailable until the backend exposes those results.</p></aside>
    </div>
  );
}
