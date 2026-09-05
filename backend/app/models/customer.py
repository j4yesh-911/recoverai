from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func

from app.database.connection import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    customer_ref = Column(String(50), unique=True, nullable=False, index=True)
    name = Column(String(100))
    email = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())