import Icon from "../components/Icon";
import { DataTable, PageHeader, Panel, StatusBadge } from "../components/ui";

const predictionKpis = [
  { title: "Predicted profit", icon: "forecastChart", tone: "blue", detail: "Prediction output" },
  { title: "Actual profit", icon: "profit", tone: "teal", detail: "Observed outcome" },
  { title: "Prediction accuracy", icon: "analytics", tone: "violet", detail: "Model evaluation" },
  { title: "Model status", icon: "quality", tone: "amber", detail: "Current availability" },
];

const performanceColumns = [
  { key: "metric", label: "Evaluation metric" },
  { key: "value", label: "Result", numeric: true },
  { key: "interpretation", label: "Interpretation" },
];

function ModelOutputState({ icon, title, text, compact = false }) {
  return <div className={`prediction-empty ${compact ? "is-compact" : ""}`}><span><Icon name={icon} /></span><div><strong>{title}</strong><p>{text}</p></div></div>;
}

function PredictionKpi({ item }) {
  return <article className={`prediction-kpi prediction-kpi-${item.tone}`}><div className="prediction-kpi-heading"><span>{item.title}</span><i><Icon name={item.icon} /></i></div><strong>—</strong><small>{item.detail} unavailable</small></article>;
}

export default function ProfitPredictionPage() {
  return (
    <div className="profit-prediction-page">
      <PageHeader eyebrow="PREDICTIVE ANALYTICS" title="Profit prediction" subtitle="Compare model estimates with observed outcomes and understand the drivers behind them." actions={<StatusBadge tone="preview" dot>Prediction data unavailable</StatusBadge>} />

      <section className="prediction-hero">
        <div className="prediction-hero-grid" aria-hidden="true"><span /><span /><span /><span /></div>
        <div className="prediction-hero-copy">
          <span className="prediction-hero-kicker"><i /> PREDICTIVE MODEL WORKSPACE</span>
          <h2>Turn forecast signals into<br />confident profit decisions.</h2>
          <p>Bring model estimates and actual performance together in one decision-ready view.</p>
          <div className="prediction-hero-status"><span className="prediction-status-icon"><Icon name="forecastChart" /></span><div><strong>Model results are not connected</strong><small>The current API does not return profit prediction outputs.</small></div></div>
        </div>
        <div className="prediction-hero-art" aria-hidden="true"><div className="prediction-orbit orbit-one" /><div className="prediction-orbit orbit-two" /><div className="prediction-orbit orbit-three" /><span className="prediction-orbit-core"><Icon name="profit" /></span></div>
      </section>

      <section className="prediction-kpi-grid" aria-label="Prediction summary">
        {predictionKpis.map((item) => <PredictionKpi key={item.title} item={item} />)}
      </section>

      <section className="prediction-main-grid">
        <Panel className="prediction-comparison-panel" title="Actual vs predicted profit" subtitle="Model estimate compared with observed profit by period" action={<StatusBadge tone="preview">Awaiting results</StatusBadge>}>
          <ModelOutputState icon="forecastChart" title="Comparison chart unavailable" text="No actual or predicted profit series has been returned by the API." />
        </Panel>
        <Panel className="prediction-importance-panel" title="Feature importance" subtitle="Factors contributing to model predictions">
          <ModelOutputState icon="analytics" title="Feature drivers unavailable" text="Feature importance values are not exposed by the current API." compact />
        </Panel>
      </section>

      <section className="prediction-bottom-grid">
        <Panel className="prediction-metrics-panel" title="Model performance" subtitle="Evaluation metrics from the trained model">
          <DataTable columns={performanceColumns} rows={[]} showHeadersOnEmpty emptyMessage="Model evaluation results are not available." />
        </Panel>
        <Panel className="prediction-insights-panel" title="Prediction insights" subtitle="Business interpretation grounded in model outputs">
          <div className="prediction-insight-state"><span className="prediction-insight-mark"><Icon name="recommendations" /></span><div><strong>Insights will appear with connected predictions</strong><p>There are no prediction results available to interpret yet. This area will summarize model signals and their business context when provided by the API.</p></div><StatusBadge tone="preview">No live insights</StatusBadge></div>
          <div className="prediction-interpretation-rows"><div><span>Profit outlook</span><b>Awaiting model output</b></div><div><span>Key drivers</span><b>Awaiting feature analysis</b></div><div><span>Business interpretation</span><b>Awaiting prediction results</b></div></div>
        </Panel>
      </section>

      <aside className="prediction-integration-note"><span>i</span><p><strong>Preview state.</strong> The existing React API integration does not provide profit predictions, actual-vs-predicted comparisons, feature importance, or model evaluation results.</p></aside>
    </div>
  );
}
