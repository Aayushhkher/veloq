from pydantic import BaseModel, EmailStr, validator, Field
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum


# ─── Auth Schemas ────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8, max_length=72)
    role: Optional[str] = "user"


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"


class GoogleAuthRequest(BaseModel):
    code: str
    redirect_uri: Optional[str] = None


# ─── User Schemas ─────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    avatar_url: Optional[str]
    wallet_balance: float
    total_earned: float
    surveys_completed: int
    upi_id: Optional[str]
    kyc_status: Optional[str]
    subscription_tier: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    upi_id: Optional[str] = None
    avatar_url: Optional[str] = None


class TierUpdate(BaseModel):
    tier: str  # pulse | compass | summit


# ─── Company Schemas ──────────────────────────────────────────────────────────

class CompanyCreate(BaseModel):
    company_name: str = Field(..., min_length=2, max_length=255)
    description: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None


class CompanyOut(BaseModel):
    id: int
    user_id: int
    company_name: str
    description: Optional[str]
    website: Optional[str]
    logo_url: Optional[str]
    industry: Optional[str]
    wallet_balance: float
    total_deposited: float
    total_spent: float
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None


# ─── Survey Schemas ───────────────────────────────────────────────────────────

class QuestionCreate(BaseModel):
    question_text: str = Field(..., min_length=5)
    question_type: str
    options: Optional[List[str]] = None
    is_required: bool = True
    order: int = 0
    min_value: Optional[int] = None
    max_value: Optional[int] = None


class QuestionOut(BaseModel):
    id: int
    question_text: str
    question_type: str
    options: Optional[List[str]]
    is_required: bool
    order: int
    min_value: Optional[int]
    max_value: Optional[int]

    class Config:
        from_attributes = True


class SurveyCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = None
    reward_per_response: float = Field(..., gt=0)
    max_responses: int = Field(..., gt=0)
    estimated_time_minutes: int = Field(default=5, gt=0)
    questions: List[QuestionCreate] = Field(..., min_items=1)
    target_demographics: Optional[Dict[str, Any]] = None


class SurveyOut(BaseModel):
    id: int
    company_id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    reward_per_response: float
    max_responses: int
    current_responses: int
    total_budget: float
    estimated_time_minutes: int
    status: str
    is_active: bool
    created_at: datetime
    questions: List[QuestionOut] = []
    company_name: Optional[str] = None

    class Config:
        from_attributes = True


class SurveyListOut(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: Optional[str]
    reward_per_response: float
    max_responses: int
    current_responses: int
    estimated_time_minutes: int
    status: str
    company_name: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class SurveySubmit(BaseModel):
    answers: Dict[str, Any]  # {question_id: answer}
    time_taken_seconds: Optional[int] = None
    paste_count: Optional[int] = 0
    pasted_questions: Optional[List[int]] = []


class SurveyResponseOut(BaseModel):
    id: int
    survey_id: int
    user_id: int
    reward_earned: float
    completed_at: datetime
    is_flagged: Optional[bool] = False
    flag_reasons: Optional[List[str]] = []
    quality_score: Optional[float] = 1.0
    status: Optional[str] = "approved"

    class Config:
        from_attributes = True


# ─── Wallet Schemas ───────────────────────────────────────────────────────────

class WalletTransactionOut(BaseModel):
    id: int
    transaction_type: str
    amount: float
    balance_after: float
    description: Optional[str]
    reference_id: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class WithdrawalRequest(BaseModel):
    amount: float = Field(..., gt=0)
    upi_id: str = Field(..., min_length=5)


class WithdrawalOut(BaseModel):
    id: int
    amount: float
    upi_id: str
    status: str
    admin_notes: Optional[str]
    requested_at: datetime
    processed_at: Optional[datetime]

    class Config:
        from_attributes = True


class WithdrawalAction(BaseModel):
    action: str  # "approve" or "reject"
    admin_notes: Optional[str] = None


# ─── Payment Schemas ──────────────────────────────────────────────────────────

class CreateOrder(BaseModel):
    amount: float = Field(..., gt=0)


class OrderOut(BaseModel):
    order_id: str
    amount: float
    currency: str
    key: str


class VerifyPayment(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


# ─── Admin Schemas ────────────────────────────────────────────────────────────

class AdminStats(BaseModel):
    total_users: int
    total_companies: int
    total_surveys: int
    active_surveys: int
    total_responses: int
    total_revenue: float
    pending_withdrawals: int
    platform_earnings: float
    total_user_earnings: float = 0.0
    total_company_spent: float = 0.0
    earnings_per_user: Dict[str, float] = {}
    company_payments: Dict[str, float] = {}


class SurveyApprovalAction(BaseModel):
    action: str  # "approve" or "reject"
    rejection_reason: Optional[str] = None


# ─── Pagination ───────────────────────────────────────────────────────────────

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    per_page: int
    pages: int


TokenResponse.model_rebuild()
