const toneClasses = {
  success: "status-badge-success",
  warning: "status-badge-warning",
  danger: "status-badge-danger",
  info: "status-badge-info",
  neutral: "status-badge-neutral",
}

export function StatusBadge({ children, tone = "neutral", className = "" }) {
  return <span className={`status-badge ${toneClasses[tone] || toneClasses.neutral} ${className}`}>{children}</span>
}
