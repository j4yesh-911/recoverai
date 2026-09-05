from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.customer import Customer
from app.models.payment import Payment
from app.models.recovery_attempt import RecoveryAttempt
from app.models.audit_log import AuditLog

from app.routes.payments import router as payment_router


app = FastAPI(
    title="RecoverAI",
    description="AI-powered autonomous revenue recovery platform",
    version="1.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(payment_router)


@app.get("/")
def root():
    return {
        "service": "RecoverAI",
        "description": "Autonomous AI Revenue Recovery",
        "status": "running"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "service": "RecoverAI"
    }