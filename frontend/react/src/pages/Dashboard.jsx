import { useCallback, useEffect, useState } from "react";

import {
  getActivity,
  getMetrics,
} from "../api/recoverai";

import MetricCard from "../components/MetricCard";
import ActivityTable from "../components/ActivityTable";

const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
};

function Dashboard({ onNavigate }) {
  const [metrics, setMetrics] =
    useState(null);

  const [activity, setActivity] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadDashboard = useCallback(
    async () => {
      try {
        const [
          metricsResponse,
          activityResponse,
        ] = await Promise.all([
          getMetrics(),
          getActivity(),
        ]);

        setMetrics(metricsResponse.data);

        setActivity(
          activityResponse.data.activity || []
        );

        setError("");
      } catch (err) {
        console.error(err);

        setError(
          "Unable to load RecoverAI dashboard data."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(
      loadDashboard,
      5000
    );

    return () => clearInterval(interval);
  }, [loadDashboard]);

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p>Loading recovery intelligence...</p>
      </div>
    );
  }

  const overview = metrics?.overview || {};
  const recovery = metrics?.recovery || {};
  const actions = metrics?.actions || {};

  const totalActions =
    Number(actions.retry_payment || 0) +
    Number(actions.send_payment_link || 0) +
    Number(actions.human_review || 0);

  return (
    <div className="page-content">
      {error && (
        <div className="error-banner page-error">
          {error}
        </div>
      )}

      <section className="hero-panel">
        <div className="hero-content">
          <span className="hero-badge">
            AUTONOMOUS REVENUE RECOVERY
          </span>

          <h1>
            Turn failed payments into
            <span> recovered revenue.</span>
          </h1>

          <p>
            RecoverAI detects revenue at risk,
            selects the safest intervention,
            executes bounded recovery workflows,
            and records every decision.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() =>
                onNavigate("recovery")
              }
            >
              Open Recovery Center
            </button>

            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                onNavigate("evaluation")
              }
            >
              View Batch Evaluation
            </button>
          </div>
        </div>

        <div className="hero-agent-visual">
          <div className="agent-orbit orbit-one" />
          <div className="agent-orbit orbit-two" />

          <div className="agent-core">
            <span>AI</span>
            <small>RECOVER</small>
          </div>

          <div className="agent-chip chip-one">
            Detect
          </div>

          <div className="agent-chip chip-two">
            Decide
          </div>

          <div className="agent-chip chip-three">
            Recover
          </div>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard
          label="Current Revenue at Risk"
          value={formatCurrency(
            overview.revenue_at_risk
          )}
          description={`${overview.failed_payments || 0} failed payments currently require attention`}
          icon="₹"
          accent="danger"
        />

        <MetricCard
          label="Revenue Recovered"
          value={formatCurrency(
            overview.recoverai_recovered
          )}
          description="Revenue successfully recovered by executed workflows"
          icon="↗"
          accent="success"
        />

        <MetricCard
          label="Recovery Rate"
          value={`${Number(
            overview.recovery_rate_percent || 0
          ).toFixed(1)}%`}
          description="Measured recovery effectiveness on current operational data"
          icon="%"
          accent="info"
        />

        <MetricCard
          label="Recovery Actions"
          value={totalActions}
          description={`${recovery.payments_recovered || 0} payments successfully recovered`}
          icon="↻"
          accent="purple"
        />
      </section>

      <section className="dashboard-two-column">
        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-eyebrow">
                AUTONOMOUS OPERATIONS
              </span>

              <h3>
                Recovery Engine
              </h3>

              <p>
                Actions taken by RecoverAI within
                configured execution boundaries.
              </p>
            </div>
          </div>

          <div className="operation-grid">
            <div className="operation-card">
              <div className="operation-icon">
                ↻
              </div>

              <div>
                <strong>
                  Automated Retries
                </strong>

                <span>
                  Temporary technical failures
                </span>
              </div>

              <b>
                {actions.retry_payment || 0}
              </b>
            </div>

            <div className="operation-card">
              <div className="operation-icon">
                ↗
              </div>

              <div>
                <strong>
                  Payment Links
                </strong>

                <span>
                  Alternative payment recovery
                </span>
              </div>

              <b>
                {actions.send_payment_link || 0}
              </b>
            </div>

            <div className="operation-card">
              <div className="operation-icon">
                ◇
              </div>

              <div>
                <strong>
                  Human Reviews
                </strong>

                <span>
                  High-risk or ambiguous cases
                </span>
              </div>

              <b>
                {recovery.human_escalations || 0}
              </b>
            </div>

            <div className="operation-card">
              <div className="operation-icon">
                ◆
              </div>

              <div>
                <strong>
                  Policy Blocks
                </strong>

                <span>
                  Unsafe execution prevented
                </span>
              </div>

              <b>
                {recovery.policy_blocks || 0}
              </b>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <span className="section-eyebrow">
                EXECUTION GUARDRAILS
              </span>

              <h3>
                Safety by Design
              </h3>

              <p>
                AI recommendations do not execute
                without deterministic policy checks.
              </p>
            </div>
          </div>

          <div className="guardrail-list">
            <div className="guardrail-item">
              <span>01</span>

              <div>
                <strong>
                  Maximum 3 attempts
                </strong>

                <p>
                  Prevents unlimited recovery loops.
                </p>
              </div>
            </div>

            <div className="guardrail-item">
              <span>02</span>

              <div>
                <strong>
                  ₹50K+ human review
                </strong>

                <p>
                  High-value transactions require
                  manual approval.
                </p>
              </div>
            </div>

            <div className="guardrail-item">
              <span>03</span>

              <div>
                <strong>
                  48-hour recovery window
                </strong>

                <p>
                  Stale transactions stop automatic
                  execution.
                </p>
              </div>
            </div>

            <div className="guardrail-item">
              <span>04</span>

              <div>
                <strong>
                  Minimum 60% AI confidence
                </strong>

                <p>
                  Low-confidence decisions are
                  safely escalated.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header panel-header-row">
          <div>
            <span className="section-eyebrow">
              LIVE OPERATIONS
            </span>

            <h3>Recent Recovery Activity</h3>

            <p>
              Latest interventions executed by
              RecoverAI.
            </p>
          </div>

          <button
            type="button"
            className="secondary-button small-button"
            onClick={() =>
              onNavigate("recovery")
            }
          >
            View Recovery Center
          </button>
        </div>

        <ActivityTable
          activity={activity}
          compact
        />
      </section>
    </div>
  );
}

export default Dashboard;