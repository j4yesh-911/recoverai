from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.recovery_attempt import RecoveryAttempt


MAX_RECOVERY_ATTEMPTS = 3
MAX_PAYMENT_LINKS = 2

HIGH_VALUE_THRESHOLD = 50000
MIN_AI_CONFIDENCE = 0.60

RECOVERY_WINDOW_HOURS = 48


def apply_recovery_policy(payment, ai_decision, db: Session):

    # --------------------------------------------------
    # PREVIOUS ATTEMPTS
    # --------------------------------------------------

    previous_attempts = (
        db.query(RecoveryAttempt)
        .filter(
            RecoveryAttempt.payment_id == payment.id
        )
        .count()
    )

    payment_link_attempts = (
        db.query(RecoveryAttempt)
        .filter(
            RecoveryAttempt.payment_id == payment.id,
            RecoveryAttempt.action == "SEND_PAYMENT_LINK"
        )
        .count()
    )

    # --------------------------------------------------
    # PAYMENT ALREADY SUCCESSFUL
    # --------------------------------------------------

    if payment.status == "SUCCESS":

        return {
            "approved": False,
            "action": "STOP",
            "reason": "Payment is already successful"
        }

    # --------------------------------------------------
    # 48-HOUR RECOVERY WINDOW
    # --------------------------------------------------

    if payment.created_at:

        recovery_deadline = (
            payment.created_at
            + timedelta(hours=RECOVERY_WINDOW_HOURS)
        )

        current_time = datetime.now(
            payment.created_at.tzinfo
        ) if payment.created_at.tzinfo else datetime.now()

        if current_time > recovery_deadline:

            return {
                "approved": False,
                "action": "HUMAN_REVIEW",
                "reason": "Payment is outside the 48-hour recovery window"
            }

    # --------------------------------------------------
    # MAXIMUM RECOVERY ATTEMPTS
    # --------------------------------------------------

    if previous_attempts >= MAX_RECOVERY_ATTEMPTS:

        return {
            "approved": False,
            "action": "HUMAN_REVIEW",
            "reason": "Maximum recovery attempts reached"
        }

    # --------------------------------------------------
    # HIGH-VALUE TRANSACTION
    # --------------------------------------------------

    if float(payment.amount) >= HIGH_VALUE_THRESHOLD:

        return {
            "approved": False,
            "action": "HUMAN_REVIEW",
            "reason": "High-value payment requires human approval"
        }

    # --------------------------------------------------
    # AI CONFIDENCE
    # --------------------------------------------------

    confidence = float(
        ai_decision.get("confidence", 0)
    )

    if confidence < MIN_AI_CONFIDENCE:

        return {
            "approved": False,
            "action": "HUMAN_REVIEW",
            "reason": "AI confidence below safe execution threshold"
        }

    # --------------------------------------------------
    # PAYMENT-LINK LIMIT
    # --------------------------------------------------

    if (
        ai_decision.get("action") == "SEND_PAYMENT_LINK"
        and payment_link_attempts >= MAX_PAYMENT_LINKS
    ):

        return {
            "approved": False,
            "action": "HUMAN_REVIEW",
            "reason": "Maximum payment-link notifications reached"
        }

    # --------------------------------------------------
    # ALLOWED ACTIONS
    # --------------------------------------------------

    allowed_actions = [
        "RETRY_PAYMENT",
        "SEND_PAYMENT_LINK",
        "HUMAN_REVIEW",
        "STOP"
    ]

    if ai_decision.get("action") not in allowed_actions:

        return {
            "approved": False,
            "action": "HUMAN_REVIEW",
            "reason": "Unauthorized recovery action"
        }

    # --------------------------------------------------
    # APPROVED
    # --------------------------------------------------

    return {
        "approved": True,
        "action": ai_decision["action"],
        "reason": ai_decision.get(
            "reason",
            "Policy approved"
        )
    }