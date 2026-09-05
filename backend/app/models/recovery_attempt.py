from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.connection import Base


class RecoveryAttempt(Base):
    __tablename__ = "recovery_attempts"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"))
    action = Column(String(50), nullable=False)
    attempt_number = Column(Integer, default=1)
    status = Column(String(30))
    reason = Column(String)
    amount_recovered = Column(Numeric(12, 2), default=0)
    created_at = Column(DateTime, server_default=func.now())