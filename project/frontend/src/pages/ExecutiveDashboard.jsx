import Icon from "../components/Icon";
import {
  AlertList,
  CategoryChart,
  InsightList,
  KpiCard,
  Panel,
  RecommendationList,
  RegionChart,
  SalesChart,
  StatusBadge,
} from "../components/ui";
import { formatCurrency, formatNumber, formatPercent } from "../lib/dataFormatters";

export default function ExecutiveDashboard({
  metrics,
  historicalChartData,
  categoryChartData,
  regionChartData,
  businessAlerts,
  priorityRecommendations,
  insights,
  onNavigate,
}) {
  const totalSales = metrics.total_sales ?? metrics["Total Sales"] ?? metrics.sales ?? 0;
  const totalProfit = metrics.total_profit ?? metrics["Total Profit"] ?? metrics.profit ?? 0;
  const profitMargin = metrics.profit_margin ?? metrics["Profit Margin"] ?? metrics.margin ?? 0;
  const totalOrders = metrics.total_orders ?? metrics["Total Orders"] ?? metrics.unique_orders ?? metrics.orders ?? 0;

  return (
    <div className="executive-dashboard">
      <section className="executive-banner">
        <div className="executive-banner-copy">
          <div className="executive-kicker"><span className="banner-pulse" /> BUSINESS INTELLIGENCE / OVERVIEW</div>
          <h1>See the business<br /><em>from every angle.</em></h1>
          <p>Performance, patterns, and priorities in one decision-ready view.</p>
        </div>
        <div className="banner-visual" aria-hidden="true">
          <div className="banner-ring ring-one" /><div className="banner-ring ring-two" />
          <div className="banner-orbit"><i /><i /><i /></div>
          <div className="banner-core"><Icon name="dashboard" /></div>
          <div className="banner-coordinate coordinate-top">SDADIS <span>/</span> 01</div>
          <div className="banner-coordinate coordinate-bottom">DECISION INTELLIGENCE</div>
        </div>
        <div className="executive-banner-foot">
          <span><i /> Metrics sourced from the connected API</span>
          <span>EXECUTIVE VIEW <b>01</b></span>
        </div>
      </section>

      <div className="executive-section-heading">
        <div><span className="section-index">01</span><div><h2>Business pulse</h2><p>Current performance indicators from the connected dataset</p></div></div>
        <StatusBadge tone="live" dot>Live API</StatusBadge>
      </div>

      <section className="executive-kpis" aria-label="Key business metrics">
        <KpiCard title="Total Sales" value={formatCurrency(totalSales)} icon="₹" tone="blue" />
        <KpiCard title="Total Profit" value={formatCurrency(totalProfit)} icon="↗" tone="teal" />
        <KpiCard title="Profit Margin" value={formatPercent(profitMargin)} icon="%" tone="violet" />
        <KpiCard title="Total Orders" value={formatNumber(totalOrders)} icon="#" tone="amber" />
      </section>

      <div className="executive-section-heading section-spaced">
        <div><span className="section-index">02</span><div><h2>Performance signals</h2><p>Explore how sales and profit are distributed over time and across the business</p></div></div>
        <span className="section-caption">ACTUALS &amp; COMPARISONS</span>
      </div>

      <section className="executive-chart-grid">
        <Panel title="Sales over time" subtitle="Monthly historical sales" className="executive-trend-panel" action={<span className="chart-unit">MONTHLY · INR</span>}>
          <SalesChart data={historicalChartData} height={330} />
        </Panel>
        <Panel title="Business alerts" subtitle="Signals that may need attention" className="executive-alert-panel" action={<button className="text-action" onClick={() => onNavigate("alerts")}>All alerts <span>→</span></button>}>
          <AlertList alerts={businessAlerts.slice(0, 4)} emptyMessage="No business alerts are available." />
        </Panel>
      </section>

      <section className="executive-chart-grid comparison-grid">
        <Panel title="Category performance" subtitle="Sales and profit by category" action={<span className="chart-unit">SALES / PROFIT</span>}>
          <CategoryChart data={categoryChartData} height={270} />
        </Panel>
        <Panel title="Regional performance" subtitle="Compare business across regions" action={<span className="chart-unit">SALES / PROFIT</span>}>
          <RegionChart data={regionChartData} height={270} />
        </Panel>
      </section>

      <div className="executive-section-heading section-spaced">
        <div><span className="section-index">03</span><div><h2>Decision intelligence</h2><p>Recommendations and insights generated from business analysis</p></div></div>
        <StatusBadge tone="live" dot>Live API</StatusBadge>
      </div>
      <section className="executive-decision-grid">
        <Panel title="Priority recommendations" subtitle="Actions ranked by business priority" action={<button className="text-action" onClick={() => onNavigate("recommendations")}>View recommendations <span>→</span></button>} className="decision-recommendations">
          <RecommendationList recommendations={priorityRecommendations.slice(0, 4)} />
        </Panel>
        <Panel title="Business insights" subtitle="Observations returned by the analytics engine" action={<button className="text-action" onClick={() => onNavigate("analytics")}>Explore analytics <span>→</span></button>} className="decision-insights">
          <InsightList insights={insights.slice(0, 4)} />
        </Panel>
      </section>
    </div>
  );
}
