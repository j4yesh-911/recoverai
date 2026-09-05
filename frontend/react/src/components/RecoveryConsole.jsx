import { useState } from "react";

import {
  analyzePayment,
  recoverPayment,
} from "../api/recoverai";

import StatusBadge from "./StatusBadge";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
};

function RecoveryConsole({
  payment,
  onRecoveryComplete,
}) {
  const [decision, setDecision] = useState(null);
  const [execution, setExecution] =
    useState(null);

  const [analyzing, setAnalyzing] =
    useState(false);

  const [executing, setExecuting] =
    useState(false);

  const [error, setError] = useState("");

  const runAnalysis = async () => {
    if (!payment) {
      return;
    }

    setAnalyzing(true);
    setError("");
    setDecision(null);
    setExecution(null);

    try {
      const response =
        await analyzePayment(payment.id);

      setDecision(response.data);
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Unable to obtain AI decision."
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const executeRecovery = async () => {
    if (!payment) {
      return;
    }

    setExecuting(true);
    setError("");

    try {
      const response =
        await recoverPayment(payment.id);

      setExecution(response.data);

      if (onRecoveryComplete) {
        await onRecoveryComplete(
          response.data
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          "Recovery execution failed safely."
      );
    } finally {
      setExecuting(false);
    }
  };

  if (!payment) {
    return (
      <div className="console-empty">
        <div className="console-empty-graphic">
          AI
        </div>

        <h3>Select a failed payment</h3>

        <p>
          Choose a transaction from the queue to
          inspect its risk profile and run the
          RecoverAI agent.
        </p>
      </div>
    );
  }

  const executionObject =
    execution?.execution || null;

  const policyDecision =
    execution?.policy_decision || null;

  const aiFromExecution =
    execution?.ai_decision || null;

  return (
    <div className="recovery-console">
      <div className="console-payment-header">
        <div>
          <span className="section-eyebrow">
            SELECTED PAYMENT
          </span>

          <h3>{payment.payment_ref}</h3>

          <p>
            {payment.payment_method || "Unknown method"}
            {" • "}
            {payment.failure_reason || "Unknown failure"}
          </p>
        </div>

        <div className="console-amount">
          {formatCurrency(payment.amount)}

          <span>{payment.currency}</span>
        </div>
      </div>

      <div className="console-divider" />

      <div className="transaction-facts">
        <div>
          <span>Status</span>

          <strong>
            <StatusBadge
              status={payment.status}
            />
          </strong>
        </div>

        <div>
          <span>Customer ID</span>

          <strong>
            #{payment.customer_id}
          </strong>
        </div>

        <div>
          <span>Payment Method</span>

          <strong>
            {payment.payment_method || "—"}
          </strong>
        </div>

        <div>
          <span>Failure Reason</span>

          <strong>
            {payment.failure_reason || "—"}
          </strong>
        </div>
      </div>

      {!decision && !execution && (
        <div className="console-action-block">
          <div>
            <h4>AI Decision Agent</h4>

            <p>
              RecoverAI will analyze the payment
              failure and recommend one bounded
              recovery action.
            </p>
          </div>

          <button
            className="primary-button"
            type="button"
            onClick={runAnalysis}
            disabled={analyzing}
          >
            {analyzing
              ? "AI Analyzing..."
              : "Analyze with RecoverAI"}
          </button>
        </div>
      )}

      {decision && (
        <div className="ai-decision-card">
          <div className="decision-header">
            <div>
              <span className="section-eyebrow">
                AI RECOMMENDATION
              </span>

              <h4>
                {decision.action?.replaceAll(
                  "_",
                  " "
                )}
              </h4>
            </div>

            <div className="confidence-score">
              <strong>
                {Math.round(
                  Number(
                    decision.confidence || 0
                  ) * 100
                )}
                %
              </strong>

              <span>confidence</span>
            </div>
          </div>

          <p className="decision-reason">
            {decision.reason}
          </p>

          <div className="policy-notice">
            <span className="policy-shield">
              ◆
            </span>

            <div>
              <strong>
                Guardrails enforced server-side
              </strong>

              <p>
                The policy engine will validate
                confidence, transaction value,
                attempt limits and recovery window
                before any action executes.
              </p>
            </div>
          </div>

          {!execution && (
            <button
              type="button"
              className="execute-button"
              disabled={executing}
              onClick={executeRecovery}
            >
              {executing
                ? "Executing Safe Workflow..."
                : "Execute Recovery Workflow"}
            </button>
          )}
        </div>
      )}

      {policyDecision && (
        <div className="result-panel">
          <div className="result-panel-title">
            Policy Engine Decision
          </div>

          <div className="result-grid">
            <div>
              <span>Approved</span>

              <strong>
                {policyDecision.approved
                  ? "YES"
                  : "NO"}
              </strong>
            </div>

            <div>
              <span>Final Action</span>

              <strong>
                {policyDecision.action?.replaceAll(
                  "_",
                  " "
                )}
              </strong>
            </div>
          </div>

          <p>{policyDecision.reason}</p>
        </div>
      )}

      {executionObject && (
        <div className="execution-result">
          <div className="execution-result-header">
            <div>
              <span className="section-eyebrow">
                WORKFLOW RESULT
              </span>

              <h4>
                Recovery Execution
              </h4>
            </div>

            <StatusBadge
              status={executionObject.status}
            />
          </div>

          <div className="result-grid">
            <div>
              <span>Action</span>

              <strong>
                {(
                  executionObject.action ||
                  policyDecision?.action ||
                  aiFromExecution?.action ||
                  "—"
                ).replaceAll("_", " ")}
              </strong>
            </div>

            <div>
              <span>Recovered</span>

              <strong className="success-value">
                {formatCurrency(
                  executionObject.amount_recovered
                )}
              </strong>
            </div>
          </div>

          {executionObject.message && (
            <p>
              {executionObject.message}
            </p>
          )}

          {execution?.attempt_number && (
            <div className="attempt-label">
              Recorded as recovery attempt #
              {execution.attempt_number}
            </div>
          )}
        </div>
      )}

      {execution &&
        !executionObject &&
        execution.status && (
          <div className="execution-result">
            <div className="execution-result-header">
              <h4>Recovery Result</h4>

              <StatusBadge
                status={execution.status}
              />
            </div>

            <p>
              {execution.message ||
                "Workflow completed."}
            </p>
          </div>
        )}

      {error && (
        <div className="error-banner">
          <strong>Request failed</strong>
          <span>{error}</span>
        </div>
      )}

      {(decision || execution) && (
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setDecision(null);
            setExecution(null);
            setError("");
          }}
        >
          Reset console
        </button>
      )}
    </div>
  );
}

export default RecoveryConsole;