import StatusBadge from "./StatusBadge";

const formatTime = (value) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "medium",
    }
  );
};

function AuditTable({ logs = [] }) {
  if (!logs.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◎</div>
        <h3>No audit events recorded</h3>

        <p>
          Every AI decision, policy block and
          recovery execution will be recorded here.
        </p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table audit-table">
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Payment</th>
            <th>Event</th>
            <th>Actor</th>
            <th>Decision</th>
            <th>Action</th>
            <th>Result</th>
          </tr>
        </thead>

        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="table-secondary audit-time">
                {formatTime(log.created_at)}
              </td>

              <td>
                <span className="payment-reference">
                  {log.payment_ref}
                </span>
              </td>

              <td>
                <span className="event-type">
                  {log.event_type?.replaceAll(
                    "_",
                    " "
                  )}
                </span>
              </td>

              <td>
                <span className="actor-chip">
                  {log.actor}
                </span>
              </td>

              <td className="decision-cell">
                {log.decision || "—"}
              </td>

              <td>
                {log.action_taken?.replaceAll(
                  "_",
                  " "
                ) || "—"}
              </td>

              <td>
                <StatusBadge
                  status={log.result}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AuditTable;