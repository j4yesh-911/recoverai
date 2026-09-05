import { useState } from "react";

import { runSimulation } from "../api/recoverai";

import MetricCard from "../components/MetricCard";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
};

function Evaluation() {
  const [evaluation, setEvaluation] =
    useState(null);

  const [running, setRunning] =
    useState(false);

  const [error, setError] =
    useState("");

  const executeEvaluation = async () => {
    setRunning(true);
    setError("");

    try {
      const response =
        await runSimulation(10000);

      setEvaluation(response.data);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to run synthetic evaluation."
      );
    } finally {
      setRunning(false);
    }
  };

  const financial =
    evaluation?.financial_metrics || {};

  const operational =
    evaluation?.operational_metrics || {};

  const actions =
    evaluation?.action_distribution || {};

  const totalActions = Object.values(
    actions
  ).reduce(
    (sum, value) =>
      sum + Number(value || 0),
    0
  );

  const actionPercent = (value) => {
    if (!totalActions) {
      return 0;
    }

    return (
      (Number(value || 0) /
        totalActions) *
      100
    );
  };

  return (
    <div className="page-content">
      {error && (
        <div className="error-banner page-error">
          {error}
        </div>
      )}

      <section className="evaluation-hero">
        <div>
          <span className="hero-badge">
            MEASURED MONEY RECOVERED
          </span>

          <h1>
            Prove recovery performance
            across a batch.
          </h1>

          <p>
            Run RecoverAI against 10,000
            deterministic synthetic failed payments
            to measure recovered revenue, operational
            actions and guardrail intervention.
          </p>
        </div>

        <div className="evaluation-run-card">
          <span>
            Evaluation Dataset
          </span>

          <strong>
            10,000
          </strong>

          <p>
            synthetic failed payments
          </p>

          <button
            type="button"
            className="primary-button full-button"
            onClick={executeEvaluation}
            disabled={running}
          >
            {running
              ? "Running Evaluation..."
              : evaluation
                ? "Run Evaluation Again"
                : "Run 10,000-Payment Evaluation"}
          </button>
        </div>
      </section>

      {!evaluation && !running && (
        <section className="evaluation-placeholder">
          <div className="evaluation-placeholder-graphic">
            10K
          </div>

          <h2>
            Batch evaluation ready
          </h2>

          <p>
            Start the simulation to measure baseline
            recovery against RecoverAI intervention.
          </p>

          <div className="evaluation-features">
            <span>Deterministic seed</span>
            <span>Financial metrics</span>
            <span>Action distribution</span>
            <span>Guardrail tracking</span>
          </div>
        </section>
      )}

      {running && (
        <section className="simulation-running">
          <div className="simulation-loader">
            <div className="simulation-ring" />
            <span>AI</span>
          </div>

          <h2>
            RecoverAI is processing the batch
          </h2>

          <p>
            Evaluating recovery actions across
            10,000 failed payment scenarios.
          </p>
        </section>
      )}

      {evaluation && !running && (
        <>
          <section className="evaluation-banner">
            <div>
              <span>
                EVALUATION COMPLETE
              </span>

              <strong>
                {
                  evaluation.evaluation
                    ?.total_payments
                }{" "}
                payments processed
              </strong>
            </div>

            <div>
              <span>
                SYNTHETIC SEED
              </span>

              <strong>
                {evaluation.evaluation?.seed}
              </strong>
            </div>
          </section>

          <section className="metrics-grid">
            <MetricCard
              label="Revenue at Risk"
              value={formatCurrency(
                financial.revenue_at_risk
              )}
              description="Total value of failed payments in the synthetic batch"
              icon="₹"
              accent="danger"
            />

            <MetricCard
              label="RecoverAI Recovered"
              value={formatCurrency(
                financial.recoverai_recovered
              )}
              description="Revenue recovered using bounded AI intervention"
              icon="↗"
              accent="success"
            />

            <MetricCard
              label="Additional Revenue"
              value={formatCurrency(
                financial.additional_revenue_recovered
              )}
              description="Incremental revenue above the baseline recovery model"
              icon="+"
              accent="purple"
            />

            <MetricCard
              label="Recovery Rate"
              value={`${Number(
                financial.recoverai_recovery_rate_percent ||
                  0
              ).toFixed(2)}%`}
              description={`Baseline: ${Number(
                financial.baseline_recovery_rate_percent ||
                  0
              ).toFixed(2)}%`}
              icon="%"
              accent="info"
            />
          </section>

          <section className="dashboard-two-column">
            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="section-eyebrow">
                    FINANCIAL IMPACT
                  </span>

                  <h3>
                    Baseline vs RecoverAI
                  </h3>
                </div>
              </div>

              <div className="comparison-bars">
                <div className="comparison-row">
                  <div className="comparison-label">
                    <span>
                      Baseline Recovered
                    </span>

                    <strong>
                      {formatCurrency(
                        financial.baseline_recovered
                      )}
                    </strong>
                  </div>

                  <div className="bar-track">
                    <div
                      className="bar-fill baseline-bar"
                      style={{
                        width: `${Math.min(
                          Number(
                            financial.baseline_recovery_rate_percent ||
                              0
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="comparison-row">
                  <div className="comparison-label">
                    <span>
                      RecoverAI Recovered
                    </span>

                    <strong>
                      {formatCurrency(
                        financial.recoverai_recovered
                      )}
                    </strong>
                  </div>

                  <div className="bar-track">
                    <div
                      className="bar-fill recoverai-bar"
                      style={{
                        width: `${Math.min(
                          Number(
                            financial.recoverai_recovery_rate_percent ||
                              0
                          ),
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="impact-highlight">
                <span>
                  Recovery Improvement
                </span>

                <strong>
                  {Number(
                    financial.improvement_percent ||
                      0
                  ).toFixed(1)}
                  %
                </strong>

                <p>
                  improvement over the simulated
                  baseline recovery process
                </p>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <div>
                  <span className="section-eyebrow">
                    OPERATIONAL OUTCOMES
                  </span>

                  <h3>
                    Batch Operations
                  </h3>
                </div>
              </div>

              <div className="outcome-grid">
                <div className="outcome-card">
                  <span>
                    Payments Recovered
                  </span>

                  <strong>
                    {operational.payments_recovered ||
                      0}
                  </strong>
                </div>

                <div className="outcome-card">
                  <span>
                    Human Escalations
                  </span>

                  <strong>
                    {operational.human_escalations ||
                      0}
                  </strong>
                </div>

                <div className="outcome-card">
                  <span>
                    Guardrail Interventions
                  </span>

                  <strong>
                    {operational.policy_blocks ||
                      0}
                  </strong>
                </div>

                <div className="outcome-card">
                  <span>
                    Total Evaluated
                  </span>

                  <strong>
                    {
                      evaluation.evaluation
                        ?.total_payments
                    }
                  </strong>
                </div>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <span className="section-eyebrow">
                  ACTION DISTRIBUTION
                </span>

                <h3>
                  Recovery Decisions
                </h3>

                <p>
                  Distribution of interventions
                  selected across the evaluation
                  batch.
                </p>
              </div>
            </div>

            <div className="distribution-list">
              <div className="distribution-row">
                <div>
                  <strong>
                    Retry Payment
                  </strong>

                  <span>
                    Temporary technical failure
                  </span>
                </div>

                <div className="distribution-bar-area">
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${actionPercent(
                          actions.RETRY_PAYMENT
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <b>
                  {actions.RETRY_PAYMENT || 0}
                </b>
              </div>

              <div className="distribution-row">
                <div>
                  <strong>
                    Send Payment Link
                  </strong>

                  <span>
                    Alternative funding recovery
                  </span>
                </div>

                <div className="distribution-bar-area">
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${actionPercent(
                          actions.SEND_PAYMENT_LINK
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <b>
                  {actions.SEND_PAYMENT_LINK || 0}
                </b>
              </div>

              <div className="distribution-row">
                <div>
                  <strong>
                    Human Review
                  </strong>

                  <span>
                    High-value or ambiguous case
                  </span>
                </div>

                <div className="distribution-bar-area">
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${actionPercent(
                          actions.HUMAN_REVIEW
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <b>
                  {actions.HUMAN_REVIEW || 0}
                </b>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default Evaluation;