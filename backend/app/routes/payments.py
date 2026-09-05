from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.payment import Payment
from app.models.recovery_attempt import RecoveryAttempt
from app.models.audit_log import AuditLog

from app.services.risk_service import (
    calculate_revenue_at_risk,
    decide_recovery_action
)
from app.services.recovery_service import execute_ai_recovery
from app.services.simulation_service import run_recovery_simulation
from app.services.ai_agent import analyze_payment_with_ai
from app.services.policy_service import apply_recovery_policy
from app.services.metrics_service import get_recovery_metrics


router = APIRouter(
    prefix="/payments",
    tags=["Payments"]
)


class PaymentCreate(BaseModel):
    payment_ref: str = Field(..., min_length=1, max_length=50)
    customer_id: int = Field(..., gt=0)
    amount: float = Field(..., gt=0)
    currency: str = Field(default="INR", min_length=3, max_length=3)
    status: str = Field(default="FAILED", min_length=1, max_length=30)
    failure_reason: str | None = Field(default=None, max_length=100)
    payment_method: str | None = Field(default=None, max_length=50)


# ---------------------------------------------------------
# CREATE PAYMENT
# ---------------------------------------------------------

@router.post("/")
def create_payment(
    payment_data: PaymentCreate,
    db: Session = Depends(get_db)
):
    existing_payment = (
        db.query(Payment)
        .filter(Payment.payment_ref == payment_data.payment_ref)
        .first()
    )

    if existing_payment:
        raise HTTPException(
            status_code=409,
            detail="Payment reference already exists"
        )

    payment = Payment(
        payment_ref=payment_data.payment_ref,
        customer_id=payment_data.customer_id,
        amount=payment_data.amount,
        currency=payment_data.currency.upper(),
        status=payment_data.status.upper(),
        failure_reason=payment_data.failure_reason,
        payment_method=payment_data.payment_method
    )

    try:
        db.add(payment)
        db.commit()
        db.refresh(payment)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Failed to create payment"
        )

    return {
        "message": "Payment created",
        "payment_id": payment.id,
        "payment_ref": payment.payment_ref
    }


# ---------------------------------------------------------
# REVENUE AT RISK
# ---------------------------------------------------------

@router.get("/risk")
def revenue_at_risk(
    db: Session = Depends(get_db)
):
    return calculate_revenue_at_risk(db)


# ---------------------------------------------------------
# METRICS
# ---------------------------------------------------------

@router.get("/metrics")
def recovery_metrics(
    db: Session = Depends(get_db)
):
    return get_recovery_metrics(db)


# ---------------------------------------------------------
# RECOVERY ACTIVITY
# ---------------------------------------------------------

@router.get("/activity")
def get_recovery_activity(
    db: Session = Depends(get_db)
):

    attempts = (
        db.query(RecoveryAttempt)
        .order_by(RecoveryAttempt.created_at.desc())
        .limit(20)
        .all()
    )

    activity = []

    for attempt in attempts:

        payment = (
            db.query(Payment)
            .filter(Payment.id == attempt.payment_id)
            .first()
        )

        if not payment:
            continue

        activity.append({
            "payment_ref": payment.payment_ref,
            "amount": float(payment.amount),
            "failure_reason": payment.failure_reason,
            "action": attempt.action,
            "attempt_number": attempt.attempt_number,
            "status": attempt.status,
            "amount_recovered": float(
                attempt.amount_recovered or 0
            ),
            "created_at": (
                attempt.created_at.isoformat()
                if attempt.created_at
                else None
            )
        })

    return {
        "count": len(activity),
        "activity": activity
    }


# ---------------------------------------------------------
# PAYMENT LIST
# ---------------------------------------------------------

@router.get("/list")
def list_payments(
    db: Session = Depends(get_db)
):

    payments = (
        db.query(Payment)
        .order_by(Payment.id.desc())
        .all()
    )

    return {
        "count": len(payments),
        "payments": [
            {
                "id": payment.id,
                "payment_ref": payment.payment_ref,
                "customer_id": payment.customer_id,
                "amount": float(payment.amount),
                "currency": payment.currency,
                "status": payment.status,
                "failure_reason": payment.failure_reason,
                "payment_method": payment.payment_method,
                "created_at": (
                    payment.created_at.isoformat()
                    if payment.created_at
                    else None
                )
            }
            for payment in payments
        ]
    }


# ---------------------------------------------------------
# AUDIT TRAIL
# ---------------------------------------------------------

@router.get("/audit")
def get_audit_logs(
    db: Session = Depends(get_db)
):

    logs = (
        db.query(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(30)
        .all()
    )

    audit = []

    for log in logs:

        payment = (
            db.query(Payment)
            .filter(Payment.id == log.payment_id)
            .first()
        )

        audit.append({
            "id": log.id,
            "payment_ref": (
                payment.payment_ref
                if payment
                else "UNKNOWN"
            ),
            "event_type": log.event_type,
            "actor": log.actor,
            "decision": log.decision,
            "action_taken": log.action_taken,
            "result": log.result,
            "created_at": (
                log.created_at.isoformat()
                if log.created_at
                else None
            )
        })

    return {
        "count": len(audit),
        "audit": audit
    }


# ---------------------------------------------------------
# SYNTHETIC BATCH SIMULATION
# ---------------------------------------------------------

@router.post("/simulate")
def simulate_recovery(
    count: int = 10000
):

    if count < 1 or count > 100000:
        raise HTTPException(
            status_code=400,
            detail="Count must be between 1 and 100000"
        )

    return run_recovery_simulation(count)


# ---------------------------------------------------------
# DECISION
# ---------------------------------------------------------

@router.get("/{payment_id}/decision")
def recovery_decision(
    payment_id: int,
    db: Session = Depends(get_db)
):

    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    return decide_recovery_action(payment)


# ---------------------------------------------------------
# AI DECISION
# ---------------------------------------------------------

@router.get("/{payment_id}/ai-decision")
def ai_decision(
    payment_id: int,
    db: Session = Depends(get_db)
):

    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    if payment.status == "SUCCESS":
        return {
            "action": "STOP",
            "confidence": 1.0,
            "reason": "Payment has already been recovered"
        }

    try:
        decision = analyze_payment_with_ai(payment)
        return decision

    except Exception:
        raise HTTPException(
            status_code=503,
            detail="AI decision service temporarily unavailable"
        )


# ---------------------------------------------------------
# EXECUTE AI RECOVERY
# ---------------------------------------------------------

@router.post("/{payment_id}/recover")
def recover_payment(
    payment_id: int,
    db: Session = Depends(get_db)
):

    payment = (
        db.query(Payment)
        .filter(Payment.id == payment_id)
        .first()
    )

    if not payment:
        raise HTTPException(
            status_code=404,
            detail="Payment not found"
        )

    if payment.status == "SUCCESS":
        return {
            "payment_ref": payment.payment_ref,
            "status": "STOPPED",
            "message": "Payment is already successful"
        }

    try:
        result = execute_ai_recovery(
            payment_id,
            db
        )

        return result

    except Exception:
        db.rollback()

        raise HTTPException(
            status_code=500,
            detail="Recovery execution failed safely"
        )


# ---------------------------------------------------------
# DATABASE HEALTH
# ---------------------------------------------------------

@router.get("/system/database-health")
def database_health(
    db: Session = Depends(get_db)
):

    try:
        db.execute(text("SELECT 1"))

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception:
        return {
            "status": "unhealthy",
            "database": "disconnected"
        }