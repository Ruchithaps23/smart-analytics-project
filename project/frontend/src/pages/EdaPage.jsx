import Icon from "../components/Icon";
import { DataTable, PageHeader, Panel, StatusBadge } from "../components/ui";

const overviewStats = [
  { label: "Rows analyzed", icon: "datasets", tone: "blue" },
  { label: "Columns detected", icon: "mapping", tone: "teal" },
  { label: "Numerical features", icon: "analytics", tone: "violet" },
  { label: "Categorical features", icon: "segments", tone: "amber" },
];

const statisticColumns = [
  { key: "feature", label: "Feature" },
  { key: "mean", label: "Mean", numeric: true },
  { key: "median", label: "Median", numeric: true },
  { key: "std", label: "Std. deviation", numeric: true },
  { key: "min", label: "Minimum", numeric: true },
  { key: "max", label: "Maximum", numeric: true },
];

const outlierColumns = [
  { key: "feature", label: "Feature" },
  { key: "method", label: "Detection method" },
  { key: "outliers", label: "Outliers", numeric: true },
  { key: "share", label: "Share", numeric: true },
];

function EdaEmpty({ icon = "analytics", title, message, compact = false }) {
  return (
    <div className={`eda-empty ${compact ? "is-compact" : ""}`}>
      <span className="eda-empty-icon"><Icon name={icon} /></span>
      <div><strong>{title}</strong><p>{message}</p></div>
    </div>
  );
}

function OverviewStat({ item }) {
  return (
    <article className={`eda-stat-card eda-stat-${item.tone}`}>
      <div className="eda-stat-heading"><span>{item.label}</span><i><Icon name={item.icon} /></i></div>
      <strong>—</strong>
      <small>Unavailable</small>
    </article>
  );
}

function DistributionPanel({ title, subtitle, icon }) {
  return (
    <Panel className="eda-chart-panel" title={title} subtitle={subtitle}>
      <EdaEmpty icon={icon} title="Analysis results not connected" message="A distribution will appear when feature analysis data is available." compact />
    </Panel>
  );
}

export default function EdaPage() {
  return (
    <div className="eda-page">
      <PageHeader
        eyebrow="DATA INTELLIGENCE"
        title="Exploratory data analysis"
        subtitle="Understand distributions, relationships, and patterns across your dataset."
        actions={<StatusBadge tone="preview" dot>Preview · results not connected</StatusBadge>}
      />

      <section className="eda-overview-banner">
        <div className="eda-overview-symbol"><Icon name="exploratory" /></div>
        <div className="eda-overview-copy"><span>EXPLORATION WORKSPACE</span><h2>See the shape behind your data.</h2><p>Dataset-level exploration becomes available when EDA results are returned by the connected API.</p></div>
        <div className="eda-status-block"><StatusBadge tone="preview" dot>Not connected</StatusBadge><small>Dataset analysis status</small></div>
      </section>

      <section className="eda-stats-grid" aria-label="Dataset summary">
        {overviewStats.map((item) => <OverviewStat key={item.label} item={item} />)}
      </section>

      <Panel className="eda-statistics-panel" title="Statistical summary" subtitle="Descriptive statistics for numerical features" action={<span className="eda-table-context">Feature profile</span>}>
        <DataTable columns={statisticColumns} rows={[]} showHeadersOnEmpty emptyMessage="Statistical results are not available from the current API." />
      </Panel>

      <section className="eda-section-block">
        <div className="eda-section-title"><div><span>NUMERICAL FEATURES</span><h2>Distribution & spread</h2></div><p>Histogram and box-plot views require feature-level analysis results.</p></div>
        <div className="eda-chart-grid eda-numeric-grid">
          <DistributionPanel title="Feature distributions" subtitle="Histogram-style distribution analysis" icon="analytics" />
          <DistributionPanel title="Spread & outliers" subtitle="Box-plot exploration by feature" icon="anomaly" />
        </div>
      </section>

      <section className="eda-section-block">
        <div className="eda-section-title"><div><span>CATEGORICAL FEATURES</span><h2>Category distribution</h2></div><p>Frequency comparisons are shown when category counts are available.</p></div>
        <DistributionPanel title="Category frequencies" subtitle="Distribution and comparison across categorical fields" icon="segments" />
      </section>

      <section className="eda-section-block">
        <div className="eda-section-title"><div><span>RELATIONSHIP ANALYSIS</span><h2>Correlation & feature relationships</h2></div></div>
        <div className="eda-chart-grid eda-correlation-grid">
          <Panel title="Correlation overview" subtitle="Feature-to-feature correlation matrix">
            <div className="eda-heatmap-empty"><div className="eda-heatmap-mark"><Icon name="mapping" /></div><strong>Correlation data is not connected</strong><p>The heatmap will populate from actual correlation results when the API exposes them.</p></div>
          </Panel>
          <Panel title="Feature relationships" subtitle="Explore meaningful relationships between variables">
            <EdaEmpty icon="exploratory" title="No relationship results available" message="Feature-pair analysis is waiting for connected EDA results." />
          </Panel>
        </div>
      </section>

      <section className="eda-chart-grid eda-outlier-insight-grid">
        <Panel title="Outlier analysis" subtitle="Feature-wise outlier summary" action={<StatusBadge tone="preview">Unavailable</StatusBadge>}>
          <DataTable columns={outlierColumns} rows={[]} showHeadersOnEmpty emptyMessage="No outlier results are returned by the current API." />
        </Panel>
        <Panel title="Business exploration insights" subtitle="Observations generated from actual analysis results">
          <EdaEmpty icon="recommendations" title="Insights will appear here" message="No EDA observations are available until analysis results are connected." />
        </Panel>
      </section>

      <aside className="eda-integration-footnote"><span>i</span><p><strong>Preview state.</strong> The existing API integration provides business-level summaries, but it does not expose dataset-level EDA statistics, distributions, correlations, outliers, or generated observations.</p></aside>
    </div>
  );
}
