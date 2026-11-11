import {
  CategoryChart,
  InsightList,
  PageHeader,
  Panel,
  ProductTable,
  RegionChart,
  SegmentChart,
  StatusBadge,
} from "../components/ui";

function DatasetCount({ label, value, marker }) {
  return <div className="analytics-count"><span className={`count-marker ${marker}`} /><span className="count-label">{label}</span><strong>{value}</strong></div>;
}

export default function AnalyticsPage({ categoryChartData, regionChartData, segmentChartData, topProducts, insights }) {
  return (
    <div className="analytics-page">
      <PageHeader
        eyebrow="OVERVIEW / ANALYTICS"
        title="Explore the numbers behind the business"
        subtitle="Compare performance across categories, regions, customers, and products."
        actions={<StatusBadge tone="live" dot>Live API data</StatusBadge>}
      />

      <section className="analytics-scope-bar">
        <div><span className="scope-icon">◎</span><div><strong>Business dimensions</strong><small>Available groups returned by the analytics API</small></div></div>
        <div className="analytics-counts">
          <DatasetCount label="Categories" value={categoryChartData.length} marker="blue" />
          <DatasetCount label="Regions" value={regionChartData.length} marker="teal" />
          <DatasetCount label="Segments" value={segmentChartData.length} marker="violet" />
          <DatasetCount label="Products" value={topProducts.length} marker="amber" />
        </div>
      </section>

      <section className="analytics-feature-grid">
        <Panel title="Category contribution" subtitle="Compare sales and profit by category" className="analytics-primary-panel" action={<span className="chart-unit">SALES / PROFIT</span>}>
          <CategoryChart data={categoryChartData} height={330} />
        </Panel>
        <Panel title="Regional footprint" subtitle="Sales and profit across regions" className="analytics-region-panel" action={<span className="chart-unit">REGION</span>}>
          <RegionChart data={regionChartData} height={330} />
        </Panel>
      </section>

      <section className="analytics-lower-grid">
        <Panel title="Customer segments" subtitle="Compare performance across customer groups" action={<span className="chart-unit">SALES / PROFIT</span>}>
          <SegmentChart data={segmentChartData} height={285} />
        </Panel>
        <Panel title="Top products" subtitle="Products ranked by the returned sales data" className="analytics-products-panel">
          <ProductTable products={topProducts.slice(0, 8)} />
        </Panel>
      </section>

      <Panel title="Business insights" subtitle="Automatically generated observations returned by the analytics service" className="analytics-insights-panel">
        <InsightList insights={insights} />
      </Panel>
    </div>
  );
}
