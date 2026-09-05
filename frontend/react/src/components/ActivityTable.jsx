import StatusBadge from "./StatusBadge";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
};

const formatTime = (value) => {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
};

function ActivityTable({
  activity = [],
  compact = false,
}) {
  if (!activity.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon">◎</div>
        <h3>No recovery activity yet</h3>
        <p>
          Recovery attempts will appear here once
          RecoverAI executes an intervention.
        </p>
      </div>
    );
  }

  const rows = compact
    ? activity.slice(0, 6)
    : activity;

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            <th>Payment</th>
            <th>Amount</th>
            <th>Failure</th>
            <th>Action</th>
            <th>Status</th>
            <th>Recovered</th>
            <th>Time</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((item, index) => (
            <tr
              key={`${item.payment_ref}-${item.attempt_number}-${index}`}
            >
              <td>
                <div className="payment-reference">
                  {item.payment_ref}
                </div>

                <div className="table-secondary">
                  Attempt #{item.attempt_number}
                </div>
              </td>

              <td className="amount-cell">
                {formatCurrency(item.amount)}
              </td>

              <td>
                <span className="failure-reason">
                  {item.failure_reason || "Unknown"}
                </span>
              </td>

              <td>
                <span className="action-text">
                  {item.action?.replaceAll(
                    "_",
                    " "
                  )}
                </span>
              </td>

              <td>
                <StatusBadge
                  status={item.status}
                />
              </td>

              <td className="recovered-cell">
                {formatCurrency(
                  item.amount_recovered
                )}
              </td>

              <td className="table-secondary">
                {formatTime(item.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ActivityTable;