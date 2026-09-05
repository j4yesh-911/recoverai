import random


def run_recovery_simulation(count: int = 10000, seed: int = 42):

    random.seed(seed)

    failure_reasons = [
        "network_error",
        "timeout",
        "gateway_error",
        "insufficient_funds",
        "insufficient_balance",
        "unknown_error"
    ]

    payment_methods = [
        "UPI",
        "CARD",
        "NETBANKING"
    ]

    amounts = [
        500,
        1000,
        2500,
        5000,
        7500,
        10000,
        15000,
        25000,
        50000,
        75000
    ]

    total_failed = 0
    revenue_at_risk = 0

    baseline_recovered = 0
    recoverai_recovered = 0

    payments_recovered = 0
    human_escalations = 0
    policy_blocks = 0

    action_counts = {
        "RETRY_PAYMENT": 0,
        "SEND_PAYMENT_LINK": 0,
        "HUMAN_REVIEW": 0,
        "STOP": 0
    }

    results = []

    for i in range(count):

        amount = random.choice(amounts)
        reason = random.choice(failure_reasons)
        method = random.choice(payment_methods)

        total_failed += 1
        revenue_at_risk += amount

        # -------------------------------------------------
        # BASELINE
        # -------------------------------------------------
        # Represents what could be recovered without
        # RecoverAI's targeted recovery strategy.
        baseline_success = random.random() < 0.15

        if baseline_success:
            baseline_recovered += amount

        # -------------------------------------------------
        # RECOVERAI DECISION
        # -------------------------------------------------

        # High-value payments require human approval.
        if amount >= 50000:

            action = "HUMAN_REVIEW"
            human_escalations += 1
            policy_blocks += 1

            recovered = 0

        # Temporary technical failures
        elif reason in [
            "network_error",
            "timeout",
            "gateway_error"
        ]:

            action = "RETRY_PAYMENT"

            # Retry has a high probability of success.
            recovered_success = random.random() < 0.75

            if recovered_success:
                recovered = amount
                payments_recovered += 1
            else:
                recovered = 0

        # Funding-related failures
        elif reason in [
            "insufficient_funds",
            "insufficient_balance"
        ]:

            action = "SEND_PAYMENT_LINK"

            # Sending a payment link itself does NOT mean
            # revenue has been recovered.
            #
            # Some customers complete payment after
            # receiving the link.
            recovered_success = random.random() < 0.45

            if recovered_success:
                recovered = amount
                payments_recovered += 1
            else:
                recovered = 0

        # Unknown / ambiguous failures
        else:

            action = "HUMAN_REVIEW"
            human_escalations += 1

            recovered_success = random.random() < 0.10

            if recovered_success:
                recovered = amount
                payments_recovered += 1
            else:
                recovered = 0

        recoverai_recovered += recovered

        action_counts[action] += 1

        results.append({
            "payment_number": i + 1,
            "amount": amount,
            "failure_reason": reason,
            "payment_method": method,
            "action": action,
            "recovered": recovered
        })

    # -------------------------------------------------
    # METRICS
    # -------------------------------------------------

    additional_revenue = (
        recoverai_recovered - baseline_recovered
    )

    baseline_recovery_rate = (
        (baseline_recovered / revenue_at_risk) * 100
        if revenue_at_risk > 0
        else 0
    )

    recoverai_recovery_rate = (
        (recoverai_recovered / revenue_at_risk) * 100
        if revenue_at_risk > 0
        else 0
    )

    improvement_percent = (
        (additional_revenue / baseline_recovered) * 100
        if baseline_recovered > 0
        else 0
    )

    return {
        "evaluation": {
            "type": "synthetic_batch",
            "seed": seed,
            "total_payments": total_failed
        },

        "financial_metrics": {
            "revenue_at_risk": round(revenue_at_risk, 2),
            "baseline_recovered": round(
                baseline_recovered, 2
            ),
            "recoverai_recovered": round(
                recoverai_recovered, 2
            ),
            "additional_revenue_recovered": round(
                additional_revenue, 2
            ),
            "baseline_recovery_rate_percent": round(
                baseline_recovery_rate, 2
            ),
            "recoverai_recovery_rate_percent": round(
                recoverai_recovery_rate, 2
            ),
            "improvement_percent": round(
                improvement_percent, 2
            )
        },

        "operational_metrics": {
            "payments_recovered": payments_recovered,
            "human_escalations": human_escalations,
            "policy_blocks": policy_blocks
        },

        "action_distribution": action_counts,

        "results": results
    }