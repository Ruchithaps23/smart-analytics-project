import Icon from "../../components/Icon";
import { PageHeader, StatusBadge } from "../../components/ui";

export function DataManagementHeader({ title, subtitle }) {
  return <PageHeader eyebrow="DATA MANAGEMENT" title={title} subtitle={subtitle} actions={<StatusBadge tone="preview" dot>Frontend preview</StatusBadge>} />;
}

export function ApiCapabilityNotice({ title, children, icon = "datasets" }) {
  return <aside className="data-capability-notice"><span className="capability-icon"><Icon name={icon}/></span><div><strong>{title}</strong><p>{children}</p></div><StatusBadge tone="preview">Not connected</StatusBadge></aside>;
}

export function DatasetMetric({ label, value, note }) {
  return <div className="dataset-metric"><span>{label}</span><strong>{value}</strong>{note && <small>{note}</small>}</div>;
}
