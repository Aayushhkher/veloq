from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base


class SurveyStatus(str, enum.Enum):
    DRAFT = "draft"
    PENDING = "pending"
    ACTIVE = "active"
    PAUSED = "paused"
    COMPLETED = "completed"
    REJECTED = "rejected"


class QuestionType(str, enum.Enum):
    MCQ = "mcq"
    CHECKBOX = "checkbox"
    RATING = "rating"
    TEXT = "text"
    SCALE = "scale"


class Survey(Base):
    __tablename__ = "surveys"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    reward_per_response = Column(Float, nullable=False)
    max_responses = Column(Integer, nullable=False)
    current_responses = Column(Integer, default=0)
    total_budget = Column(Float, nullable=False)
    estimated_time_minutes = Column(Integer, default=5)
    status = Column(Enum(SurveyStatus), default=SurveyStatus.DRAFT)
    is_active = Column(Boolean, default=False)
    rejection_reason = Column(Text, nullable=True)
    target_demographics = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    company = relationship("Company", back_populates="surveys")
    questions = relationship("SurveyQuestion", back_populates="survey", cascade="all, delete-orphan", order_by="SurveyQuestion.order")
    responses = relationship("SurveyResponse", back_populates="survey")


class SurveyQuestion(Base):
    __tablename__ = "survey_questions"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    question_type = Column(Enum(QuestionType), nullable=False)
    options = Column(JSON, nullable=True)  # For MCQ/checkbox
    is_required = Column(Boolean, default=True)
    order = Column(Integer, default=0)
    min_value = Column(Integer, nullable=True)  # For rating/scale
    max_value = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    survey = relationship("Survey", back_populates="questions")


class SurveyResponse(Base):
    __tablename__ = "survey_responses"

    id = Column(Integer, primary_key=True, index=True)
    survey_id = Column(Integer, ForeignKey("surveys.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    answers = Column(JSON, nullable=False)  # {question_id: answer}
    reward_earned = Column(Float, nullable=False)
    ip_address = Column(String(50), nullable=True)
    completed_at = Column(DateTime(timezone=True), server_default=func.now())
    time_taken_seconds = Column(Integer, nullable=True)

    # Relationships
    survey = relationship("Survey", back_populates="responses")
    user = relationship("User", back_populates="survey_responses")
