function MetricCard({
  label,
  value,
  description,
  icon,
  accent = "default",
}) {
  return (
    <div className={`metric-card metric-${accent}`}>
      <div className="metric-card-top">
        <div className="metric-icon">
          {icon}
        </div>

        <span className="metric-label">
          {label}
        </span>
      </div>

      <div className="metric-value">
        {value}
      </div>

      <div className="metric-description">
        {description}
      </div>
    </div>
  );
}

export default MetricCard;