function Header({
  title,
  subtitle,
  databaseHealthy,
}) {
  return (
    <header className="top-header">
      <div>
        <div className="breadcrumb">
          RECOVERAI / CONTROL CENTER
        </div>

        <h2>{title}</h2>

        <p>{subtitle}</p>
      </div>

      <div className="header-actions">
        <div
          className={`system-status ${
            databaseHealthy
              ? "system-online"
              : "system-offline"
          }`}
        >
          <span className="system-status-dot" />

          <div>
            <strong>
              {databaseHealthy
                ? "System Operational"
                : "System Degraded"}
            </strong>

            <span>
              {databaseHealthy
                ? "Database connected"
                : "Check backend"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;