from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


# ─── Consent Management (DPDP Act) ────────────────────────────────────────────

class ConsentType(str, enum.Enum):
    TERMS_OF_SERVICE = "terms_of_service"
    PRIVACY_POLICY = "privacy_policy"
    MARKETING = "marketing"
    DATA_PROCESSING = "data_processing"


class UserConsent(Base):
    __tablename__ = "user_consents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    consent_type = Column(Enum(ConsentType), nullable=False)
    granted = Column(Boolean, default=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    version = Column(String(20), default="1.0")  # Policy version
    granted_at = Column(DateTime(timezone=True), server_default=func.now())
    withdrawn_at = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="consents")


# ─── Data Breach Log (DPDP Act Sec. 8) ───────────────────────────────────────

class BreachSeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class BreachStatus(str, enum.Enum):
    DETECTED = "detected"
    INVESTIGATING = "investigating"
    CONTAINED = "contained"
    REPORTED = "reported"
    RESOLVED = "resolved"


class DataBreachLog(Base):
    __tablename__ = "data_breach_logs"

    id = Column(Integer, primary_key=True, index=True)
    incident_id = Column(String(50), unique=True, nullable=False)  # Auto-generated e.g. INC-2024-001
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    severity = Column(Enum(BreachSeverity), default=BreachSeverity.MEDIUM)
    status = Column(Enum(BreachStatus), default=BreachStatus.DETECTED)
    affected_users_count = Column(Integer, default=0)
    data_categories_affected = Column(JSON, nullable=True)  # ["email", "phone", "pan"]
    reported_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    government_notified_at = Column(DateTime(timezone=True), nullable=True)
    users_notified_at = Column(DateTime(timezone=True), nullable=True)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    incident_report = Column(Text, nullable=True)  # Generated report JSON/text
    remediation_steps = Column(Text, nullable=True)

    reporter = relationship("User", foreign_keys=[reported_by])


# ─── Data Access Log (Audit Trail) ───────────────────────────────────────────

class DataAccessLog(Base):
    __tablename__ = "data_access_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    accessed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(100), nullable=False)  # "profile_view", "data_export", "withdrawal", etc.
    resource_type = Column(String(100), nullable=True)  # "user", "transaction", "survey_response"
    resource_id = Column(String(100), nullable=True)
    ip_address = Column(String(50), nullable=True)
    user_agent = Column(String(500), nullable=True)
    extra_data = Column(JSON, nullable=True)
    accessed_at = Column(DateTime(timezone=True), server_default=func.now())


# ─── KYC Records (PMLA Compliance) ───────────────────────────────────────────

class KYCStatus(str, enum.Enum):
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"
    EXPIRED = "expired"


class KYCRecord(Base):
    __tablename__ = "kyc_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    pan_number = Column(String(20), nullable=True)
    pan_verified = Column(Boolean, default=False)
    pan_name = Column(String(255), nullable=True)  # Name as per PAN card
    date_of_birth = Column(String(20), nullable=True)
    aadhaar_last4 = Column(String(4), nullable=True)
    status = Column(Enum(KYCStatus), default=KYCStatus.PENDING)
    verification_source = Column(String(100), default="manual")  # "razorpay", "cashfree", "manual"
    verified_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="kyc_record")


# ─── TDS Records (Income Tax Compliance) ────────────────────────────────────

class TDSStatus(str, enum.Enum):
    BELOW_THRESHOLD = "below_threshold"
    THRESHOLD_REACHED = "threshold_reached"
    TDS_DEDUCTED = "tds_deducted"
    CERTIFICATE_ISSUED = "certificate_issued"


class TDSRecord(Base):
    __tablename__ = "tds_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    financial_year = Column(String(10), nullable=False)  # "2024-25"
    total_income = Column(Float, default=0.0)
    tds_threshold = Column(Float, default=30000.0)  # ₹30,000 threshold (platform-specific)
    tds_rate = Column(Float, default=10.0)  # 10% TDS (Section 194-O for platforms)
    tds_amount = Column(Float, default=0.0)
    tds_held_amount = Column(Float, default=0.0)  # Amount currently held
    status = Column(Enum(TDSStatus), default=TDSStatus.BELOW_THRESHOLD)
    certificate_url = Column(String(500), nullable=True)
    certificate_number = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="tds_records")


# ─── Payout Audit Trail ───────────────────────────────────────────────────────

class PayoutAuditLog(Base):
    __tablename__ = "payout_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(String(100), unique=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    user_pan = Column(String(20), nullable=True)
    user_email = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    tds_deducted = Column(Float, default=0.0)
    net_amount = Column(Float, nullable=False)
    upi_id = Column(String(100), nullable=False)
    status = Column(String(50), nullable=False)
    withdrawal_id = Column(Integer, ForeignKey("withdrawals.id"), nullable=True)
    processed_at = Column(DateTime(timezone=True), server_default=func.now())
    financial_year = Column(String(10), nullable=False)
    extra_data = Column(JSON, nullable=True)

    user = relationship("User")


# ─── Grievance Tickets (Consumer Protection) ─────────────────────────────────

class GrievanceStatus(str, enum.Enum):
    OPEN = "open"
    IN_REVIEW = "in_review"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"


class GrievanceCategory(str, enum.Enum):
    PAYMENT = "payment"
    SURVEY = "survey"
    ACCOUNT = "account"
    PRIVACY = "privacy"
    FRAUD = "fraud"
    OTHER = "other"


class GrievanceTicket(Base):
    __tablename__ = "grievance_tickets"

    id = Column(Integer, primary_key=True, index=True)
    ticket_number = Column(String(30), unique=True, nullable=False)  # GRV-2024-000001
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    category = Column(Enum(GrievanceCategory), nullable=False)
    subject = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(Enum(GrievanceStatus), default=GrievanceStatus.OPEN)
    priority = Column(String(20), default="normal")  # low, normal, high, urgent
    assigned_to = Column(Integer, ForeignKey("users.id"), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)  # 30-day resolution requirement

    user = relationship("User", foreign_keys=[user_id])
    assignee = relationship("User", foreign_keys=[assigned_to])
    comments = relationship("GrievanceComment", back_populates="ticket")


class GrievanceComment(Base):
    __tablename__ = "grievance_comments"

    id = Column(Integer, primary_key=True, index=True)
    ticket_id = Column(Integer, ForeignKey("grievance_tickets.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)  # Admin-only notes
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    ticket = relationship("GrievanceTicket", back_populates="comments")
    author = relationship("User", foreign_keys=[author_id])


# ─── Review Moderation (IS 19000 Compliance) ─────────────────────────────────

class ReviewStatus(str, enum.Enum):
    ACTIVE = "active"
    FLAGGED = "flagged"
    REMOVED = "removed"
    RESTORED = "restored"


class ReviewFlag(Base):
    __tablename__ = "review_flags"

    id = Column(Integer, primary_key=True, index=True)
    survey_response_id = Column(Integer, ForeignKey("survey_responses.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)  # Who submitted the review
    flagged_by = Column(Integer, ForeignKey("users.id"), nullable=True)  # Who flagged it
    status = Column(Enum(ReviewStatus), default=ReviewStatus.ACTIVE)
    flag_reason = Column(String(500), nullable=True)
    admin_notes = Column(Text, nullable=True)
    removal_reason = Column(String(500), nullable=True)
    removed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    flagged_at = Column(DateTime(timezone=True), nullable=True)
    removed_at = Column(DateTime(timezone=True), nullable=True)
    # Must retain for 180 days per IS 19000
    retention_until = Column(DateTime(timezone=True), nullable=True)
    review_content = Column(JSON, nullable=True)  # Snapshot of original review

    reviewer = relationship("User", foreign_keys=[user_id])
    flagger = relationship("User", foreign_keys=[flagged_by])
    remover = relationship("User", foreign_keys=[removed_by])
