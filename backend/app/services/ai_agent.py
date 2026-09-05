import json
import os

from dotenv import load_dotenv
from openai import OpenAI


load_dotenv()


client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)


ALLOWED_ACTIONS = [
    "RETRY_PAYMENT",
    "SEND_PAYMENT_LINK",
    "HUMAN_REVIEW",
    "STOP"
]


def safe_fallback(reason):

    return {
        "action": "HUMAN_REVIEW",
        "confidence": 0,
        "reason": reason
    }


def analyze_payment_with_ai(payment):

    prompt = f"""
You are RecoverAI, an AI revenue recovery decision agent.

Analyze this failed payment and recommend ONE recovery action.

Payment information:

Payment reference: {payment.payment_ref}
Amount: {float(payment.amount)}
Currency: {payment.currency}
Payment method: {payment.payment_method}
Failure reason: {payment.failure_reason}
Status: {payment.status}

Allowed actions:

RETRY_PAYMENT
SEND_PAYMENT_LINK
HUMAN_REVIEW
STOP

Rules:

- Temporary technical failures such as network errors,
  timeout and gateway errors may be retried.

- Insufficient funds or insufficient balance should normally
  use a payment link.

- High-value or ambiguous transactions should go to human review.

- Already successful payments must use STOP.

- Never invent an action.

- The policy engine will make the final authorization decision.

- Confidence must be a number between 0 and 1.

Return ONLY valid JSON:

{{
    "action": "ONE_ALLOWED_ACTION",
    "confidence": 0.0,
    "reason": "short explanation"
}}
"""

    try:

        response = client.chat.completions.create(
            model="openrouter/free",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.1
        )

        raw_response = (
            response.choices[0]
            .message
            .content
            .strip()
        )

    except Exception:

        return safe_fallback(
            "AI service unavailable; manual review required"
        )

    # --------------------------------------------------
    # CLEAN MODEL RESPONSE
    # --------------------------------------------------

    raw_response = raw_response.replace(
        "```json",
        ""
    )

    raw_response = raw_response.replace(
        "```",
        ""
    )

    raw_response = raw_response.strip()

    # --------------------------------------------------
    # PARSE JSON
    # --------------------------------------------------

    try:

        decision = json.loads(
            raw_response
        )

    except json.JSONDecodeError:

        return safe_fallback(
            "AI response could not be safely parsed"
        )

    # --------------------------------------------------
    # VALIDATE ACTION
    # --------------------------------------------------

    action = decision.get("action")

    if action not in ALLOWED_ACTIONS:

        return safe_fallback(
            "AI returned an unauthorized action"
        )

    # --------------------------------------------------
    # VALIDATE CONFIDENCE
    # --------------------------------------------------

    try:

        confidence = float(
            decision.get("confidence", 0)
        )

    except (TypeError, ValueError):

        return safe_fallback(
            "AI returned an invalid confidence value"
        )

    if confidence < 0 or confidence > 1:

        return safe_fallback(
            "AI confidence must be between 0 and 1"
        )

    # --------------------------------------------------
    # VALIDATE REASON
    # --------------------------------------------------

    reason = decision.get(
        "reason",
        ""
    )

    if not isinstance(reason, str):

        return safe_fallback(
            "AI returned an invalid reasoning field"
        )

    # --------------------------------------------------
    # FINAL SAFE DECISION
    # --------------------------------------------------

    return {
        "action": action,
        "confidence": confidence,
        "reason": reason[:500]
    }