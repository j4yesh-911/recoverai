from sqlalchemy.orm import Session

from app.models.payment import Payment
from app.models.recovery_attempt import RecoveryAttempt
from app.models.audit_log import AuditLog

from app.services.ai_agent import analyze_payment_with_ai
from app.services.policy_service import apply_recovery_policy

from app.services.action_tools import (
    retry_payment,
    send_payment_link,
    escalate_to_human
)


def execute_ai_recovery(payment_id: int, db: Session):

    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        return {
            "error": "Payment not found"
        }

    # --------------------------------------------------
    # SAFETY: ALREADY SUCCESSFUL
    # --------------------------------------------------

    if payment.status == "SUCCESS":

        audit = AuditLog(
            payment_id=payment.id,
            event_type="RECOVERY_STOPPED",
            actor="RecoverAI",
            decision="Payment is already successful",
            action_taken="STOP",
            result="ALREADY_SUCCESS"
        )

        db.add(audit)
        db.commit()

        return {
            "payment_ref": payment.payment_ref,
            "execution": {
                "status": "STOPPED",
                "action": "STOP",
                "reason": "Payment is already successful"
            }
        }

    try:

        # --------------------------------------------------
        # AI DECISION
        # --------------------------------------------------

        ai_decision = analyze_payment_with_ai(payment)

        # --------------------------------------------------
        # POLICY / GUARDRAIL CHECK
        # --------------------------------------------------

        policy_decision = apply_recovery_policy(
            payment,
            ai_decision,
            db
        )

        # --------------------------------------------------
        # POLICY BLOCKED
        # --------------------------------------------------

        if not policy_decision["approved"]:

            audit = AuditLog(
                payment_id=payment.id,
                event_type="POLICY_BLOCKED",
                actor="RecoverAI",
                decision=policy_decision["reason"],
                action_taken=policy_decision["action"],
                result="BLOCKED"
            )

            db.add(audit)

            db.commit()

            return {
                "payment_ref": payment.payment_ref,
                "ai_decision": ai_decision,
                "policy_decision": policy_decision,
                "execution": {
                    "status": "BLOCKED",
                    "action": policy_decision["action"]
                }
            }

        # --------------------------------------------------
        # APPROVED ACTION
        # --------------------------------------------------

        action = policy_decision["action"]

        if action == "RETRY_PAYMENT":

            result = retry_payment(
                payment,
                db
            )

        elif action == "SEND_PAYMENT_LINK":

            result = send_payment_link(
                payment,
                db
            )

        elif action == "HUMAN_REVIEW":

            result = escalate_to_human(
                payment,
                db
            )

        elif action == "STOP":

            result = {
                "tool": "none",
                "success": True,
                "status": "STOPPED",
                "amount_recovered": 0,
                "message": "Recovery workflow stopped"
            }

        else:

            result = {
                "tool": "none",
                "success": False,
                "status": "INVALID_ACTION",
                "amount_recovered": 0,
                "message": "Invalid recovery action"
            }

        # --------------------------------------------------
        # ATTEMPT NUMBER
        # --------------------------------------------------

        previous_attempts = (
            db.query(RecoveryAttempt)
            .filter(
                RecoveryAttempt.payment_id == payment.id
            )
            .count()
        )

        attempt_number = previous_attempts + 1

        # --------------------------------------------------
        # RECOVERY ATTEMPT
        # --------------------------------------------------

        attempt = RecoveryAttempt(
            payment_id=payment.id,
            action=action,
            attempt_number=attempt_number,
            status=result["status"],
            reason=ai_decision.get(
                "reason",
                ""
            ),
            amount_recovered=result.get(
                "amount_recovered",
                0
            )
        )

        db.add(attempt)

        # --------------------------------------------------
        # AUDIT TRAIL
        # --------------------------------------------------

        audit = AuditLog(
            payment_id=payment.id,
            event_type="AI_RECOVERY_EXECUTION",
            actor="RecoverAI",
            decision=ai_decision.get(
                "reason",
                ""
            ),
            action_taken=action,
            result=result["status"]
        )

        db.add(audit)

        db.commit()

        return {
            "payment": {
                "payment_ref": payment.payment_ref,
                "amount": float(payment.amount),
                "currency": payment.currency,
                "failure_reason": payment.failure_reason,
                "status": payment.status
            },

            "ai_decision": ai_decision,

            "policy_decision": policy_decision,

            "execution": result,

            "attempt_number": attempt_number
        }

    except Exception as error:

        # --------------------------------------------------
        # SAFE FAILURE
        # --------------------------------------------------

        db.rollback()

        try:

            audit = AuditLog(
                payment_id=payment.id,
                event_type="RECOVERY_ERROR",
                actor="RecoverAI",
                decision="Recovery execution encountered an internal error",
                action_taken="HUMAN_REVIEW",
                result="FAILED_SAFELY"
            )

            db.add(audit)
            db.commit()

        except Exception:

            db.rollback()

        return {
            "payment_ref": payment.payment_ref,
            "execution": {
                "status": "FAILED_SAFELY",
                "action": "HUMAN_REVIEW",
                "message": "Recovery failed safely and requires review"
            }
        }