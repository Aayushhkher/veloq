from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Float, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class UserRole(str, enum.Enum):
    USER = "user"
    COMPANY = "company"
    ADMIN = "admin"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    full_name = Column(String(255), nullable=False)
    hashed_password = Column(String(255), nullable=True)  # null for OAuth users
    role = Column(Enum(UserRole), default=UserRole.USER, nullable=False)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    avatar_url = Column(String(500), nullable=True)
    google_id = Column(String(255), unique=True, nullable=True)
    phone = Column(String(20), nullable=True)
    upi_id = Column(String(100), nullable=True)
    pan_number = Column(String(20), nullable=True)
    is_phone_verified = Column(Boolean, default=False)
    kyc_status = Column(String(20), default="pending")  # pending, verified, rejected
    subscription_tier = Column(String(20), default=None, nullable=True)  # pulse, compass, summit
    marketing_consent = Column(Boolean, default=True)
    data_processing_consent = Column(Boolean, default=False)
    consent_version = Column(String(20), nullable=True)
    wallet_balance = Column(Float, default=0.0)
    total_earned = Column(Float, default=0.0)
    surveys_completed = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    survey_responses = relationship("SurveyResponse", back_populates="user")
    wallet_transactions = relationship("WalletTransaction", back_populates="user")
    withdrawals = relationship("Withdrawal", back_populates="user")
    consents = relationship("UserConsent", back_populates="user")
    kyc_record = relationship("KYCRecord", back_populates="user", uselist=False)
    tds_records = relationship("TDSRecord", back_populates="user")
