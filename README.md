# RecoverAI — Autonomous AI Revenue Recovery Platform

RecoverAI is an AI-powered revenue recovery platform that detects failed payments, determines an appropriate recovery intervention, executes bounded recovery actions, and records the complete decision trail.

## Problem

Failed payments create revenue at risk for businesses. Simply identifying failed payments is not enough — the system should determine which payments are recoverable, choose an appropriate intervention, execute it within defined limits, and measure the money recovered.

## Solution

RecoverAI closes the recovery loop:

**Failed Payment → AI Decision → Policy/Guardrail Check → Recovery Action → Result → Audit Trail → Metrics**

The system supports different interventions based on payment context:

- **Retry Payment** for potentially temporary technical failures
- **Send Payment Link** when the customer may need another funding source
- **Human Review** for high-value or uncertain cases
- **Stop** when recovery policies do not allow further action

## Key Features

### AI Recovery Agent

The AI agent analyzes payment context and recommends one bounded action:

- `RETRY_PAYMENT`
- `SEND_PAYMENT_LINK`
- `HUMAN_REVIEW`
- `STOP`

The AI recommendation is not executed directly. It is passed through the policy engine first.

### Policy & Guardrails

RecoverAI uses deterministic rules to control autonomous recovery:

- Maximum 3 recovery attempts
- Maximum 2 payment links
- ₹50,000 high-value threshold
- Minimum AI confidence threshold of 0.60
- 48-hour recovery window
- Only approved recovery actions can be executed
- Successful payments cannot be recovered again
- High-value payments are escalated to human review
- Invalid or unsafe AI recommendations fail safely

### Audit Trail

Important decisions and actions are recorded in PostgreSQL, including:

- AI decisions
- Policy blocks
- Recovery actions
- Execution results
- Human escalations
- Recovery amounts

This provides an auditable history of the recovery workflow.

## Evaluation

RecoverAI includes a deterministic synthetic evaluation over **10,000 payments**.

The evaluation compares:

- Baseline recovered revenue
- RecoverAI recovered revenue
- Additional revenue recovered
- Baseline recovery rate
- RecoverAI recovery rate
- Recovery improvement
- Payments recovered
- Human escalations
- Policy blocks
- Action distribution

The key business metric is **additional revenue recovered compared with the baseline**.

> Evaluation figures shown in the final demo should be generated directly from the RecoverAI evaluation screen.

## Architecture

```text
                 FAILED PAYMENT
                       │
                       ▼
              ┌─────────────────┐
              │ Detection Layer │
              └────────┬────────┘
                       │
                       ▼
              ┌─────────────────┐
              │   AI Recovery   │
              │      Agent      │
              └────────┬────────┘
                       │
                 Recommendation
                       │
                       ▼
              ┌─────────────────┐
              │ Policy / Guard  │
              │     Engine      │
              └────────┬────────┘
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       RETRY       PAYMENT LINK   HUMAN
                                    REVIEW
          │            │            │
          └────────────┼────────────┘
                       ▼
              Recovery Result
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
        Recovery DB          Audit Log
             │
             ▼
          Metrics
             │
             ▼
         Dashboard