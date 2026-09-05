import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getActivity,
  getPayments,
} from "../api/recoverai";

import RecoveryConsole from "../components/RecoveryConsole";
import ActivityTable from "../components/ActivityTable";
import StatusBadge from "../components/StatusBadge";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
};

function Recovery() {
  const [payments, setPayments] =
    useState([]);

  const [activity, setActivity] =
    useState([]);

  const [selectedPayment, setSelectedPayment] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadData = useCallback(
    async () => {
      try {
        const [
          paymentResponse,
          activityResponse,
        ] = await Promise.all([
          getPayments(),
          getActivity(),
        ]);

        const paymentList =
          paymentResponse.data.payments || [];

        setPayments(paymentList);

        setActivity(
          activityResponse.data.activity || []
        );

        setSelectedPayment((current) => {
          if (!current) {
            return null;
          }

          return (
            paymentList.find(
              (item) =>
                item.id === current.id
            ) || null
          );
        });

        setError("");
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load recovery queue."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const failedPayments = useMemo(
    () =>
      payments.filter(
        (payment) =>
          payment.status === "FAILED"
      ),
    [payments]
  );

  const revenueAtRisk = failedPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0
  );

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Loading failed payments...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      {error && (
        <div className="error-banner page-error">
          {error}
        </div>
      )}

      <section className="recovery-summary-strip">
        <div>
          <span>
            Failed Payments
          </span>

          <strong>
            {failedPayments.length}
          </strong>
        </div>

        <div>
          <span>
            Revenue at Risk
          </span>

          <strong>
            {formatCurrency(revenueAtRisk)}
          </strong>
        </div>

        <div>
          <span>
            AI Execution
          </span>

          <strong>Bounded</strong>
        </div>

        <div>
          <span>
            Audit Trail
          </span>

          <strong>Enabled</strong>
        </div>
      </section>

      <section className="recovery-workspace">
        <div className="payment-queue-panel">
          <div className="panel-header">
            <div>
              <span className="section-eyebrow">
                RECOVERY QUEUE
              </span>

              <h3>Failed Payments</h3>

              <p>
                Select a payment to begin AI-assisted
                recovery.
              </p>
            </div>

            <span className="queue-count">
              {failedPayments.length}
            </span>
          </div>

          <div className="payment-list">
            {failedPayments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  ✓
                </div>

                <h3>No failed payments</h3>

                <p>
                  There is currently no revenue in
                  the recovery queue.
                </p>
              </div>
            ) : (
              failedPayments.map((payment) => (
                <button
                  key={payment.id}
                  type="button"
                  className={`payment-list-item ${
                    selectedPayment?.id ===
                    payment.id
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedPayment(payment)
                  }
                >
                  <div className="payment-list-main">
                    <div>
                      <strong>
                        {payment.payment_ref}
                      </strong>

                      <span>
                        {payment.payment_method ||
                          "Unknown method"}
                      </span>
                    </div>

                    <b>
                      {formatCurrency(
                        payment.amount
                      )}
                    </b>
                  </div>

                  <div className="payment-list-footer">
                    <span className="failure-reason">
                      {payment.failure_reason ||
                        "unknown_error"}
                    </span>

                    <StatusBadge
                      status={payment.status}
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="console-panel">
          <RecoveryConsole
            payment={selectedPayment}
            onRecoveryComplete={loadData}
          />
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <span className="section-eyebrow">
              RECOVERY HISTORY
            </span>

            <h3>Recent Executions</h3>

            <p>
              Recovery attempts generated by the
              autonomous workflow.
            </p>
          </div>
        </div>

        <ActivityTable
          activity={activity}
        />
      </section>
    </div>
  );
}

export default Recovery;