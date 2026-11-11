import { formatCurrency, formatNumber, getValue } from "../lib/dataFormatters";
import {
  AlertList,
  ForecastChart,
  ForecastTable,
  KpiCard,
  PageHeader,
  Panel,
  RecommendationList,
  StatusBadge,
} from "../components/ui";

export function ForecastPage({ forecast, forecastChartData }) {
  const total = forecastChartData.reduce((sum, row) => sum + (Number(row.forecast) || 0), 0);
  const average = forecastChartData.length ? total / forecastChartData.length : 0;
  return <div className="secondary-page forecast-page">
    <PageHeader eyebrow="PREDICTIVE ANALYTICS" title="Sales forecasting" subtitle="Review future sales estimates returned by the forecasting service." actions={<StatusBadge tone="live" dot>Live API</StatusBadge>} />
    <section className="kpi-grid forecast-kpi-grid"><KpiCard title="Forecast months" value={formatNumber(forecast.length)} icon="◷" tone="blue"/><KpiCard title="Total forecast" value={formatCurrency(total)} icon="₹" tone="teal"/><KpiCard title="Average monthly forecast" value={formatCurrency(average)} icon="≈" tone="violet"/><KpiCard title="Forecast horizon" value={`${forecast.length} months`} icon="→" tone="amber"/></section>
    <Panel title="Future sales outlook" subtitle="Monthly predicted sales values from the forecast endpoint" className="forecast-main-panel"><ForecastChart data={forecastChartData} height={360}/></Panel>
    <Panel title="Forecast schedule" subtitle="Monthly forecast values"><ForecastTable forecast={forecastChartData}/></Panel>
  </div>;
}

function priorityCount(alerts, level) {
  return alerts.filter((item) => String(getValue(item, ["priority", "Priority", "severity", "Severity"], "")).toLowerCase().includes(level)).length;
}

export function AlertsPage({ businessAlerts, decisionAlerts }) {
  const alerts = [...businessAlerts.map((item) => ({ ...item, alertSource: "Business alert" })), ...decisionAlerts.map((item) => ({ ...item, alertSource: "Decision alert" }))];
  return <div className="secondary-page alerts-page">
    <PageHeader eyebrow="DECISION INTELLIGENCE" title="Alerts & signals" subtitle="Review business risks and decision alerts returned by the connected APIs." actions={<StatusBadge tone="live" dot>Live API</StatusBadge>} />
    <div className="alert-overview-strip"><div><span className="alert-strip-label">Attention overview</span><strong>{alerts.length} <small>total alerts</small></strong></div><div className="alert-severity-count critical-count"><span>Critical</span><strong>{priorityCount(alerts, "critical")}</strong></div><div className="alert-severity-count high-count"><span>High</span><strong>{priorityCount(alerts, "high")}</strong></div><div className="alert-severity-count medium-count"><span>Medium</span><strong>{priorityCount(alerts, "medium")}</strong></div></div>
    <Panel title="All business and decision alerts" subtitle="Severity and descriptions from the current API responses"><AlertList alerts={alerts} emptyMessage="No alerts were returned by the current API responses."/></Panel>
  </div>;
}

function countPriority(items, priority) {
  return items.filter((item) => String(getValue(item, ["priority", "Priority", "level", "Level"], "")).toLowerCase() === priority).length;
}

export function RecommendationsPage({ recommendations, priorityRecommendations }) {
  return <div className="secondary-page recommendations-page">
    <PageHeader eyebrow="DECISION INTELLIGENCE" title="Recommendations" subtitle="Turn business evidence into prioritized next steps." actions={<StatusBadge tone="live" dot>Live API</StatusBadge>} />
    <section className="recommendation-priority-row"><div className="priority-intro"><span className="page-eyebrow">PRIORITY DISTRIBUTION</span><strong>Recommended actions</strong><p>Counts reflect priority values in the recommendations API response.</p></div><div className="priority-counts"><div><span>Critical</span><strong>{countPriority(recommendations, "critical")}</strong></div><div><span>High</span><strong>{countPriority(recommendations, "high")}</strong></div><div><span>Medium</span><strong>{countPriority(recommendations, "medium")}</strong></div><div><span>Low</span><strong>{countPriority(recommendations, "low")}</strong></div></div></section>
    <Panel title="Priority actions" subtitle="Highest-priority actions returned by the API"><RecommendationList recommendations={priorityRecommendations} detailed/></Panel>
    <Panel title="All recommendations" subtitle="Complete recommendation set returned by the API"><RecommendationList recommendations={recommendations} detailed/></Panel>
  </div>;
}

