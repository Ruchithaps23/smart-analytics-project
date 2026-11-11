import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency, getValue } from "../../lib/dataFormatters";
import StatusBadge from "../StatusBadge";
export { StatusBadge };

export function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="page-eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {actions && <div className="page-heading-actions">{actions}</div>}
    </div>
  );
}

export function KpiCard({ title, value, icon, note, tone = "blue" }) {
  return (
    <article className={`kpi-card kpi-${tone}`}>
      <div className="kpi-card-heading"><span>{title}</span><span className="kpi-card-icon" aria-hidden="true">{icon}</span></div>
      <strong className="kpi-card-value">{value}</strong>
      {note && <span className="kpi-card-note">{note}</span>}
    </article>
  );
}

export function Panel({ title, subtitle, action, children, className = "" }) {
  return (
    <section className={`surface-panel ${className}`}>
      {(title || subtitle || action) && (
        <header className="surface-panel-heading">
          <div>{title && <h2>{title}</h2>}{subtitle && <p>{subtitle}</p>}</div>
          {action && <div className="surface-panel-action">{action}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function EmptyState({ title = "No data available", message, icon = "—" }) {
  return (
    <div className="empty-state">
      <span className="empty-state-icon" aria-hidden="true">{icon}</span>
      <strong>{title}</strong>
      {message && <p>{message}</p>}
    </div>
  );
}

function ChartFrame({ data, message, children, height = 300 }) {
  if (!data?.length) return <EmptyState message={message} />;
  return <div className="chart-frame"><ResponsiveContainer width="100%" height={height}>{children}</ResponsiveContainer></div>;
}

const axisProps = { tickLine: false, axisLine: false, tick: { fill: "#8591a5", fontSize: 10 } };
const gridProps = { stroke: "#e9edf4", strokeDasharray: "3 5", vertical: false };

export function SalesChart({ data, height = 310 }) {
  return (
    <ChartFrame data={data} message="Historical sales data has not been returned by the API." height={height}>
      <LineChart data={data} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="month" {...axisProps} tickMargin={10} />
        <YAxis {...axisProps} tickFormatter={(value) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value)} width={48} />
        <Tooltip formatter={(value) => [formatCurrency(value), "Sales"]} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 12px 30px rgba(23,39,66,.12)" }} />
        <Line type="monotone" dataKey="sales" name="Sales" stroke="#3978f6" strokeWidth={3} dot={false} activeDot={{ r: 5, fill: "#3978f6", stroke: "#fff", strokeWidth: 3 }} />
      </LineChart>
    </ChartFrame>
  );
}

function RegionAxisTick({ x, y, payload }) {
  const words = String(payload?.value ?? "").split(/\s+/);
  const lines = [];
  let current = "";
  words.forEach((word) => {
    if (current && `${current} ${word}`.length > 15) {
      lines.push(current);
      current = word;
    } else current = current ? `${current} ${word}` : word;
  });
  if (current) lines.push(current);
  return <text x={x - 8} y={y} textAnchor="end" fill="#78869b" fontSize="10">{lines.map((line, index) => <tspan key={`${line}-${index}`} x={x - 8} dy={index === 0 ? `${-((lines.length - 1) * 5)}px` : "11px"}>{line}</tspan>)}</text>;
}

function ComparisonChart({ data, emptyMessage, height = 290, horizontal = false, colors = ["#3978f6", "#13a89e"] }) {
  return (
    <ChartFrame data={data} message={emptyMessage} height={height}>
      <BarChart data={data} layout={horizontal ? "vertical" : "horizontal"} margin={{ top: 8, right: 12, left: 0, bottom: horizontal ? 0 : 10 }}>
        <CartesianGrid {...gridProps} />
        {horizontal ? <><XAxis type="number" {...axisProps} tickFormatter={(value) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value)} /><YAxis type="category" dataKey="name" tick={<RegionAxisTick />} interval={0} tickLine={false} axisLine={false} width={106} tickMargin={10} /></> : <><XAxis dataKey="name" {...axisProps} tickMargin={9} /><YAxis {...axisProps} tickFormatter={(value) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value)} width={44} /></>}
        <Tooltip allowEscapeViewBox={{ x: false, y: false }} wrapperStyle={{ maxWidth: "calc(100% - 20px)", zIndex: 20, pointerEvents: "none" }} formatter={(value, name) => [formatCurrency(value), name === "sales" ? "Sales" : "Profit"]} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 12px 30px rgba(23,39,66,.12)" }} />
        <Bar dataKey="sales" name="Sales" fill={colors[0]} radius={horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0]} maxBarSize={30} />
        <Bar dataKey="profit" name="Profit" fill={colors[1]} radius={horizontal ? [0, 5, 5, 0] : [5, 5, 0, 0]} maxBarSize={30} />
      </BarChart>
    </ChartFrame>
  );
}

export function CategoryChart({ data, height }) {
  return <ComparisonChart data={data} height={height} emptyMessage="Category performance data is not available." />;
}

export function RegionChart({ data, height = 290 }) {
  return <ComparisonChart data={data} height={height} horizontal emptyMessage="Regional performance data is not available." colors={["#3978f6", "#13a89e"]} />;
}

export function SegmentChart({ data, height }) {
  return <ComparisonChart data={data} height={height} emptyMessage="Customer segment data is not available." colors={["#5c6fe8", "#13a89e"]} />;
}

export function ForecastChart({ data, height = 310 }) {
  return (
    <ChartFrame data={data} message="Forecast values have not been returned by the API." height={height}>
      <BarChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 5 }}>
        <CartesianGrid {...gridProps} />
        <XAxis dataKey="month" {...axisProps} tickMargin={10} />
        <YAxis {...axisProps} tickFormatter={(value) => new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(value)} width={48} />
        <Tooltip allowEscapeViewBox={{ x: false, y: false }} wrapperStyle={{ maxWidth: "calc(100% - 20px)", zIndex: 20, pointerEvents: "none" }} formatter={(value) => [formatCurrency(value), "Forecast"]} contentStyle={{ border: "1px solid #e2e8f0", borderRadius: 10 }} />
        <Bar dataKey="forecast" name="Forecast" fill="#13a89e" radius={[5, 5, 0, 0]} maxBarSize={34} />
      </BarChart>
    </ChartFrame>
  );
}

export function DataTable({ columns, rows = [], emptyMessage = "No records available.", rowKey, showHeadersOnEmpty = false }) {
  if (!rows.length && !showHeadersOnEmpty) return <EmptyState message={emptyMessage} />;
  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead><tr>{columns.map((column) => <th key={column.key} className={column.numeric ? "is-numeric" : ""}>{column.label}</th>)}</tr></thead>
        <tbody>{rows.length ? rows.map((row, index) => <tr key={rowKey ? rowKey(row, index) : index}>{columns.map((column) => <td key={column.key} className={`${column.numeric ? "is-numeric" : ""} ${column.className?.(row) || ""}`}>{column.render ? column.render(row, index) : String(row[column.key] ?? "—")}</td>)}</tr>) : <tr className="table-empty-row"><td colSpan={columns.length}>{emptyMessage}</td></tr>}</tbody>
      </table>
    </div>
  );
}

export function ProductTable({ products }) {
  return <DataTable rows={products} emptyMessage="No product data is available." columns={[
    { key: "product", label: "Product", render: (row) => String(getValue(row, ["product_name", "Product Name", "product", "Product", "name", "Name"], "Unknown Product")) },
    { key: "sales", label: "Sales", numeric: true, render: (row) => formatCurrency(getValue(row, ["sales", "Sales", "total_sales"])) },
    { key: "profit", label: "Profit", numeric: true, className: (row) => Number(getValue(row, ["profit", "Profit", "total_profit"])) < 0 ? "negative-value" : "positive-value", render: (row) => formatCurrency(getValue(row, ["profit", "Profit", "total_profit"])) },
  ]} />;
}

export function ForecastTable({ forecast }) {
  return <DataTable rows={forecast} emptyMessage="No forecast data is available." columns={[
    { key: "month", label: "Month", render: (row) => String(row.month) },
    { key: "forecast", label: "Forecast sales", numeric: true, className: () => "positive-value", render: (row) => formatCurrency(row.forecast) },
  ]} />;
}

export function AlertList({ alerts, emptyMessage = "No alerts available." }) {
  if (!alerts?.length) return <EmptyState message={emptyMessage} />;
  return <div className="alert-list">{alerts.map((alert, index) => {
    const priority = String(getValue(alert, ["priority", "Priority", "severity", "Severity"], "medium")).toLowerCase();
    const title = getValue(alert, ["alert", "Alert", "title", "Title", "issue", "Issue", "message", "Message"], "Business alert");
    const description = getValue(alert, ["description", "Description", "details", "Details", "evidence", "Evidence", "recommendation", "Recommendation"], "");
    return <article className="alert-item" key={index}><span className={`alert-indicator ${priority}`} /><div className="alert-content"><div className="alert-heading"><strong>{String(title)}</strong><StatusBadge tone={priority}>{priority}</StatusBadge></div>{description && <p>{String(description)}</p>}</div></article>;
  })}</div>;
}

export function RecommendationList({ recommendations, detailed = false }) {
  if (!recommendations?.length) return <EmptyState message="No recommendations available." />;
  return <div className="recommendation-list">{recommendations.map((recommendation, index) => {
    const priority = String(getValue(recommendation, ["priority", "Priority", "level", "Level"], "medium")).toLowerCase();
    const category = getValue(recommendation, ["category", "Category"], "Business");
    const issue = getValue(recommendation, ["issue", "Issue", "title", "Title"], "Business issue");
    const evidence = getValue(recommendation, ["evidence", "Evidence"], "");
    const action = getValue(recommendation, ["recommendation", "Recommendation", "action", "Action"], "");
    const impact = getValue(recommendation, ["business_impact", "Business Impact", "impact", "Impact"], "");
    const benefit = getValue(recommendation, ["expected_benefit", "Expected Benefit", "benefit", "Benefit"], "");
    return <article className={`recommendation-card ${priority}`} key={index}><div className="recommendation-top"><span className="recommendation-category">{String(category)}</span><StatusBadge tone={priority}>{priority}</StatusBadge></div><h3>{String(issue)}</h3>{evidence && <div className="recommendation-row"><span>Evidence</span><p>{String(evidence)}</p></div>}{action && <div className="recommendation-row action-row"><span>Action</span><p>{String(action)}</p></div>}{detailed && impact && <div className="recommendation-row"><span>Business impact</span><p>{String(impact)}</p></div>}{detailed && benefit && <div className="recommendation-row"><span>Expected benefit</span><p>{String(benefit)}</p></div>}</article>;
  })}</div>;
}

export function InsightList({ insights }) {
  if (!insights?.length) return <EmptyState message="No automated insights are available." />;
  return <div className="insight-list">{insights.map((insight, index) => {
    const title = getValue(insight, ["title", "Title", "insight", "Insight", "category", "Category"], "Business insight");
    const text = getValue(insight, ["description", "Description", "insight", "Insight", "message", "Message", "evidence", "Evidence"], "");
    return <article className="insight-item" key={index}><span className="insight-number">{String(index + 1).padStart(2, "0")}</span><div><strong>{String(title)}</strong>{text && <p>{String(text)}</p>}</div></article>;
  })}</div>;
}
