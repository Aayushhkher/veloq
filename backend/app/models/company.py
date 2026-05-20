from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    company_name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    website = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)
    industry = Column(String(100), nullable=True)
    wallet_balance = Column(Float, default=0.0)
    total_deposited = Column(Float, default=0.0)
    total_spent = Column(Float, default=0.0)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    user = relationship("User")
    surveys = relationship("Survey", back_populates="company")
    payments = relationship("Payment", back_populates="company")
