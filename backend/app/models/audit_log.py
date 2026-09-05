from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.connection import Base


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"))
    event_type = Column(String(50), nullable=False)
    actor = Column(String(50), nullable=False)
    decision = Column(Text)
    action_taken = Column(String(100))
    result = Column(String(100))
    created_at = Column(DateTime, server_default=func.now())