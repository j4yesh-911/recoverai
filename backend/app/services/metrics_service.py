from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.models.recovery_attempt import RecoveryAttempt
from app.models.audit_log import AuditLog


def get_recovery_metrics(db: Session):

    total_failed = (
        db.query(Payment)
        .filter(Payment.status == "FAILED")
        .count()
    )

    total_payments = db.query(Payment).count()

    revenue_at_risk = sum(
        float(payment.amount)
        for payment in db.query(Payment)
        .filter(Payment.status == "FAILED")
        .all()
    )

    recovered_attempts = (
        db.query(RecoveryAttempt)
        .filter(
            RecoveryAttempt.status == "PAYMENT_RECOVERED"
        )
        .all()
    )

    recoverai_recovered = sum(
        float(attempt.amount_recovered or 0)
        for attempt in recovered_attempts
    )

    payments_recovered = len(recovered_attempts)

    human_escalations = (
        db.query(RecoveryAttempt)
        .filter(
            RecoveryAttempt.status == "ESCALATED"
        )
        .count()
    )

    policy_blocks = (
        db.query(AuditLog)
        .filter(
            AuditLog.result == "BLOCKED"
        )
        .count()
    )

    retry_count = (
        db.query(RecoveryAttempt)
        .filter(
            RecoveryAttempt.action == "RETRY_PAYMENT"
        )
        .count()
    )

    payment_link_count = (
        db.query(RecoveryAttempt)
        .filter(
            RecoveryAttempt.action == "SEND_PAYMENT_LINK"
        )
        .count()
    )

    human_review_count = (
        db.query(RecoveryAttempt)
        .filter(
            RecoveryAttempt.action == "HUMAN_REVIEW"
        )
        .count()
    )

    recovery_rate = (
        (recoverai_recovered / revenue_at_risk) * 100
        if revenue_at_risk > 0
        else 0
    )

    return {
        "overview": {
            "total_payments": total_payments,
            "failed_payments": total_failed,
            "revenue_at_risk": round(
                revenue_at_risk, 2
            ),
            "recoverai_recovered": round(
                recoverai_recovered, 2
            ),
            "recovery_rate_percent": round(
                recovery_rate, 2
            )
        },

        "recovery": {
            "payments_recovered": payments_recovered,
            "human_escalations": human_escalations,
            "policy_blocks": policy_blocks
        },

        "actions": {
            "retry_payment": retry_count,
            "send_payment_link": payment_link_count,
            "human_review": human_review_count
        }
    }