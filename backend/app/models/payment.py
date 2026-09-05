
from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.connection import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    payment_ref = Column(String(50), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"))
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR")
    status = Column(String(30), nullable=False)
    failure_reason = Column(String(100))
    payment_method = Column(String(50))
    created_at = Column(DateTime, server_default=func.now())
