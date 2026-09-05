const navigationItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "◈",
  },
  {
    id: "recovery",
    label: "Recovery",
    icon: "↻",
  },
  {
    id: "evaluation",
    label: "Evaluation",
    icon: "◉",
  },
  {
    id: "audit",
    label: "Audit Trail",
    icon: "◎",
  },
];

function Sidebar({ currentPage, onNavigate }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">R</div>

        <div className="brand-copy">
          <h1>RecoverAI</h1>
          <span>Revenue Recovery</span>
        </div>
      </div>

      <div className="sidebar-section-label">
        CONTROL CENTER
      </div>

      <nav className="sidebar-nav">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`nav-item ${
              currentPage === item.id ? "active" : ""
            }`}
            onClick={() => onNavigate(item.id)}
          >
            <span className="nav-icon">
              {item.icon}
            </span>

            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="agent-status-card">
          <div className="agent-status-header">
            <span className="status-dot" />
            <span>RecoverAI Agent</span>
          </div>

          <p>
            Autonomous recovery engine with bounded
            execution and policy guardrails.
          </p>
        </div>

        <div className="buildathon-tag">
          Razorpay AI Buildathon 2026
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;