export default function StatusBadge({ tone = "neutral", children, dot = false }) {
  return <span className={`status-badge tone-${tone}`}>{dot && <i />}{children}</span>;
}
