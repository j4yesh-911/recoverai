import random

from sqlalchemy.orm import Session
from app.models.payment import Payment


def retry_payment(payment: Payment, db: Session):

    reason = (payment.failure_reason or "").lower()

    success_probability = {
        "network_error": 0.85,
        "timeout": 0.75,
        "gateway_error": 0.70
    }.get(reason, 0.20)

    recovered = random.random() < success_probability

    if recovered:

        payment.status = "SUCCESS"

        db.add(payment)

        return {
            "tool": "retry_payment",
            "success": True,
            "status": "PAYMENT_RECOVERED",
            "amount_recovered": float(payment.amount),
            "message": "Payment successfully recovered after retry"
        }

    return {
        "tool": "retry_payment",
        "success": False,
        "status": "RETRY_FAILED",
        "amount_recovered": 0,
        "message": "Payment retry did not succeed"
    }


def send_payment_link(payment: Payment, db: Session):

    payment_link = (
        f"https://recoverai.demo/pay/{payment.payment_ref}"
    )

    return {
        "tool": "send_payment_link",
        "success": True,
        "status": "PAYMENT_LINK_SENT",
        "amount_recovered": 0,
        "payment_link": payment_link,
        "message": "Recovery payment link generated in simulation"
    }


def escalate_to_human(payment: Payment, db: Session):

    return {
        "tool": "escalate_to_human",
        "success": True,
        "status": "ESCALATED",
        "amount_recovered": 0,
        "message": "Payment escalated for human review"
    }