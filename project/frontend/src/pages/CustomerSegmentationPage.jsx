import Icon from "../components/Icon";
import { DataTable, PageHeader, Panel, SegmentChart, StatusBadge } from "../components/ui";
import { formatCurrency, formatNumber } from "../lib/dataFormatters";

const segmentColumns = [
  { key: "name", label: "Segment", render: (row) => String(row.name || "Unlabeled segment") },
  { key: "customers", label: "Customers", numeric: true, render: () => "Unavailable" },
  { key: "characteristics", label: "Characteristics", render: () => "Not returned by API" },
  { key: "sales", label: "Sales", numeric: true, render: (row) => formatCurrency(row.sales) },
  { key: "profit", label: "Profit", numeric: true, render: (row) => formatCurrency(row.profit) },
];

const statCards = [
  { title: "Total customers", icon: "segments", tone: "blue", note: "Customer counts not exposed" },
  { title: "Number of segments", icon: "mapping", tone: "teal", note: "From available performance rows", count: true },
  { title: "Largest segment", icon: "analytics", tone: "violet", note: "Requires customer distribution" },
  { title: "Customer distribution", icon: "datasets", tone: "amber", note: "Segment-level counts unavailable" },
];

function SegmentationStat({ item, segmentCount }) {
  const available = item.count && segmentCount > 0;
  return <article className={`customer-stat customer-stat-${item.tone}`}><div className="customer-stat-heading"><span>{item.title}</span><i><Icon name={item.icon} /></i></div><strong>{available ? formatNumber(segmentCount) : "—"}</strong><small>{available ? "Segment performance groups" : item.note}</small></article>;
}

function CustomerEmpty({ icon, title, message, compact = false }) {
  return <div className={`customer-empty ${compact ? "is-compact" : ""}`}><span><Icon name={icon} /></span><div><strong>{title}</strong><p>{message}</p></div></div>;
}

export default function CustomerSegmentationPage({ segmentData = [] }) {
  const hasSegmentRows = segmentData.length > 0;

  return (
    <div className="customer-segmentation-page">
      <PageHeader eyebrow="PREDICTIVE ANALYTICS" title="Customer segmentation" subtitle="Understand distinct customer groups and the value they contribute to the business." actions={<StatusBadge tone="preview" dot>Partial API data</StatusBadge>} />

      <section className="customer-intelligence-hero">
        <div className="customer-hero-copy"><span className="customer-hero-kicker"><Icon name="segments" /> CUSTOMER INTELLIGENCE</span><h2>Know the value behind<br />every customer group.</h2><p>Compare available segment performance and connect it with customer-level profiles as those results become available.</p><div className="customer-hero-tags"><span><i className="customer-tag-dot is-performance" />Performance data</span><span><i className="customer-tag-dot is-profile" />Profile data unavailable</span></div></div>
        <div className="customer-hero-visual" aria-hidden="true"><div className="customer-orbit customer-orbit-a" /><div className="customer-orbit customer-orbit-b" /><div className="customer-orbit customer-orbit-c" /><div className="customer-orbit-core"><Icon name="segments" /></div><span className="customer-orbit-node node-a" /><span className="customer-orbit-node node-b" /><span className="customer-orbit-node node-c" /></div>
        <div className="customer-hero-status"><span>SEGMENT ANALYSIS</span><StatusBadge tone={hasSegmentRows ? "live" : "preview"} dot>{hasSegmentRows ? "Performance data available" : "Awaiting API data"}</StatusBadge></div>
      </section>

      <section className="customer-stat-grid" aria-label="Customer segment metrics">{statCards.map((item) => <SegmentationStat item={item} segmentCount={segmentData.length} key={item.title} />)}</section>

      <section className="customer-main-grid">
        <Panel className="customer-distribution-panel" title="Customer distribution" subtitle="Customer share across identified segments" action={<StatusBadge tone="preview">Counts unavailable</StatusBadge>}>
          <CustomerEmpty icon="segments" title="Customer distribution is not available" message="The API does not return customer counts or segment proportions." />
        </Panel>
        <Panel className="customer-comparison-panel" title="Segment performance comparison" subtitle="Sales and profit across the returned performance groups" action={<span className="customer-panel-key"><i className="key-sales" /> Sales <i className="key-profit" /> Profit</span>}>
          <div className="customer-chart-wrap"><SegmentChart data={segmentData} height={252} /></div>
          {!hasSegmentRows && <p className="customer-chart-note">No segment performance rows were returned by the API.</p>}
        </Panel>
      </section>

      <section className="customer-behavior-band">
        <div className="customer-behavior-title"><span>BEHAVIORAL ANALYTICS</span><h2>Customer behavior & purchasing patterns</h2><p>Explore order cadence, basket characteristics, and value patterns by group.</p></div>
        <div className="customer-behavior-content"><CustomerEmpty icon="analytics" title="Behavioral results are not connected" message="The API returns segment sales and profit only; order-level purchasing patterns are not available." compact /></div>
      </section>

      <Panel className="customer-segment-table-panel" title="Segment details" subtitle="Performance details available from the current API" action={<StatusBadge tone={hasSegmentRows ? "live" : "preview"} dot>{hasSegmentRows ? `${formatNumber(segmentData.length)} performance groups` : "No segment rows"}</StatusBadge>}>
        <DataTable rows={segmentData} columns={segmentColumns} showHeadersOnEmpty emptyMessage="Segment details will appear when performance rows are returned by the API." />
        <p className="customer-table-note"><Icon name="quality" /> Customer counts and segment characteristics are not included in the current response.</p>
      </Panel>

      <section className="customer-strategy-grid">
        <Panel title="Customer insights" subtitle="Observations from segment profiles">
          <CustomerEmpty icon="exploratory" title="No profile insights available" message="The API does not return customer segment profiles or behavior findings." compact />
        </Panel>
        <Panel title="Strategic recommendations" subtitle="Actions informed by customer evidence">
          <CustomerEmpty icon="recommendations" title="Recommendations are not connected" message="No segment-specific strategic actions are returned by the current API." compact />
        </Panel>
      </section>

      <aside className="customer-api-note"><span>i</span><p><strong>Data scope.</strong> The existing <code>/api/segments</code> response contains segment performance fields used above. It does not include customer totals, segment size, profile characteristics, purchasing patterns, or segment-specific recommendations.</p></aside>
    </div>
  );
}
