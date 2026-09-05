function StatusBadge({ status }) {
  const normalized =
    status?.toUpperCase?.() || "UNKNOWN";

  let className = "badge-neutral";

  if (
    normalized.includes("SUCCESS") ||
    normalized.includes("RECOVERED") ||
    normalized.includes("SENT")
  ) {
    className = "badge-success";
  } else if (
    normalized.includes("FAILED") ||
    normalized.includes("ERROR")
  ) {
    className = "badge-danger";
  } else if (
    normalized.includes("BLOCKED") ||
    normalized.includes("ESCALATED") ||
    normalized.includes("REVIEW")
  ) {
    className = "badge-warning";
  } else if (
    normalized.includes("RETRY") ||
    normalized.includes("RUNNING")
  ) {
    className = "badge-info";
  } else if (
    normalized.includes("STOP")
  ) {
    className = "badge-neutral";
  }

  return (
    <span className={`status-badge ${className}`}>
      {status || "UNKNOWN"}
    </span>
  );
}

export default StatusBadge;