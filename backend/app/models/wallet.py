from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class TransactionType(str, enum.Enum):
    SURVEY_REWARD = "survey_reward"
    WITHDRAWAL = "withdrawal"
    DEPOSIT = "deposit"
    COMMISSION = "commission"
    REFUND = "refund"


class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    FAILED = "failed"
    REVERSED = "reversed"


class WithdrawalStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    PROCESSING = "processing"
    COMPLETED = "completed"
    REJECTED = "rejected"


class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    amount = Column(Float, nullable=False)
    balance_after = Column(Float, nullable=False)
    description = Column(String(500), nullable=True)
    reference_id = Column(String(255), nullable=True)  # survey_id, payment_id, etc.
    status = Column(Enum(TransactionStatus), default=TransactionStatus.COMPLETED)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="wallet_transactions")


class Withdrawal(Base):
    __tablename__ = "withdrawals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    amount = Column(Float, nullable=False)
    upi_id = Column(String(100), nullable=False)
    status = Column(Enum(WithdrawalStatus), default=WithdrawalStatus.PENDING)
    admin_notes = Column(Text, nullable=True)
    razorpay_payout_id = Column(String(255), nullable=True)
    requested_at = Column(DateTime(timezone=True), server_default=func.now())
    processed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="withdrawals")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    amount = Column(Float, nullable=False)
    razorpay_order_id = Column(String(255), unique=True, nullable=False)
    razorpay_payment_id = Column(String(255), unique=True, nullable=True)
    razorpay_signature = Column(String(500), nullable=True)
    status = Column(String(50), default="created")  # created, paid, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    company = relationship("Company", back_populates="payments")
