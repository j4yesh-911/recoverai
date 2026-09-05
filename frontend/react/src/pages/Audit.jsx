import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { getAuditLogs } from "../api/recoverai";

import AuditTable from "../components/AuditTable";

function Audit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] =
    useState(true);
  const [refreshing, setRefreshing] =
    useState(false);
  const [error, setError] =
    useState("");

  const loadAudit = useCallback(
    async (manual = false) => {
      if (manual) {
        setRefreshing(true);
      }

      try {
        const response =
          await getAuditLogs();

        setLogs(
          response.data.audit || []
        );

        setError("");
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load audit trail."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    []
  );

  useEffect(() => {
    loadAudit();
  }, [loadAudit]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Loading audit trail...</p>
      </div>
    );
  }

  const blockedCount = logs.filter(
    (item) =>
      item.result === "BLOCKED"
  ).length;

  const recoveryEvents = logs.filter(
    (item) =>
      item.event_type ===
      "AI_RECOVERY_EXECUTION"
  ).length;

  const errorEvents = logs.filter(
    (item) =>
      item.event_type ===
      "RECOVERY_ERROR"
  ).length;

  return (
    <div className="page-content">
      {error && (
        <div className="error-banner page-error">
          {error}
        </div>
      )}

      <section className="audit-overview">
        <div>
          <span>
            Audit Events
          </span>

          <strong>
            {logs.length}
          </strong>

          <p>
            Latest immutable recovery decisions
          </p>
        </div>

        <div>
          <span>
            AI Executions
          </span>

          <strong>
            {recoveryEvents}
          </strong>

          <p>
            Autonomous actions recorded
          </p>
        </div>

        <div>
          <span>
            Policy Blocks
          </span>

          <strong>
            {blockedCount}
          </strong>

          <p>
            Unsafe executions prevented
          </p>
        </div>

        <div>
          <span>
            Safe Failures
          </span>

          <strong>
            {errorEvents}
          </strong>

          <p>
            Errors captured for review
          </p>
        </div>
      </section>

      <section className="audit-explainer">
        <div className="audit-shield">
          ◆
        </div>

        <div>
          <span className="section-eyebrow">
            TRACEABLE AI
          </span>

          <h2>
            Every decision leaves a trail.
          </h2>

          <p>
            RecoverAI records the agent decision,
            executed action, policy intervention,
            actor and final result for transparent
            review.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header panel-header-row">
          <div>
            <span className="section-eyebrow">
              SYSTEM AUDIT LOG
            </span>

            <h3>
              Recovery Decision History
            </h3>

            <p>
              Latest AI, policy and recovery events
              recorded by the platform.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button small-button"
            onClick={() =>
              loadAudit(true)
            }
            disabled={refreshing}
          >
            {refreshing
              ? "Refreshing..."
              : "Refresh Logs"}
          </button>
        </div>

        <AuditTable logs={logs} />
      </section>
    </div>
  );
}

export default Audit;