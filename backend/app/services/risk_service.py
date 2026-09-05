from sqlalchemy.orm import Session

from app.models.payment import Payment


def calculate_revenue_at_risk(db: Session):
    failed_payments = (
        db.query(Payment)
        .filter(Payment.status == "FAILED")
        .all()
    )

    total_at_risk = sum(
        float(payment.amount)
        for payment in failed_payments
    )

    return {
        "failed_payment_count": len(failed_payments),
        "revenue_at_risk": total_at_risk,
        "payments": [
            {
                "payment_ref": payment.payment_ref,
                "amount": float(payment.amount),
                "failure_reason": payment.failure_reason,
                "payment_method": payment.payment_method
            }
            for payment in failed_payments
        ]
    }


def decide_recovery_action(payment: Payment):
    reason = (payment.failure_reason or "").lower()
    amount = float(payment.amount)

    # Hard guardrail: expensive payments require human review
    if amount >= 50000:
        return {
            "action": "HUMAN_REVIEW",
            "reason": "High-value payment requires human approval",
            "priority": "HIGH"
        }

    # Temporary/network failures are good candidates for retry
    if reason in ["network_error", "timeout", "gateway_error"]:
        return {
            "action": "RETRY_PAYMENT",
            "reason": "Temporary payment failure may succeed on retry",
            "priority": "MEDIUM"
        }

    # Insufficient funds → send a payment link
    if reason in ["insufficient_funds", "insufficient_balance"]:
        return {
            "action": "SEND_PAYMENT_LINK",
            "reason": "Customer may complete payment using another funding source",
            "priority": "HIGH"
        }

    # Unknown failures should never be blindly retried
    return {
        "action": "HUMAN_REVIEW",
        "reason": "Failure reason requires manual investigation",
        "priority": "MEDIUM"
    }