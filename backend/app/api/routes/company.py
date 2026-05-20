from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_current_company_user
from app.models.user import User
from app.models.company import Company
from app.schemas.schemas import CompanyOut, CompanyUpdate, CompanyCreate, CreateOrder, VerifyPayment, OrderOut, TierUpdate
from app.schemas.schemas import UserOut
from app.services.payment_service import create_order, verify_and_credit_payment

VALID_TIERS = {"pulse", "compass", "summit"}

router = APIRouter(prefix="/company", tags=["Company"])


@router.get("/profile", response_model=CompanyOut)
def get_company_profile(
    current_user: User = Depends(get_current_company_user),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company profile not found")
    return company


@router.post("/profile", response_model=CompanyOut)
def create_company_profile(
    data: CompanyCreate,
    current_user: User = Depends(get_current_company_user),
    db: Session = Depends(get_db)
):
    existing = db.query(Company).filter(Company.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Company profile already exists")

    company = Company(user_id=current_user.id, **data.dict())
    db.add(company)
    db.commit()
    db.refresh(company)
    return company


@router.patch("/profile", response_model=CompanyOut)
def update_company_profile(
    data: CompanyUpdate,
    current_user: User = Depends(get_current_company_user),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    for field, value in data.dict(exclude_unset=True).items():
        setattr(company, field, value)
    db.commit()
    db.refresh(company)
    return company


@router.post("/payment/create-order", response_model=OrderOut)
def create_payment_order(
    data: CreateOrder,
    current_user: User = Depends(get_current_company_user),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return create_order(db, company, data.amount)


@router.post("/payment/verify")
def verify_payment(
    data: VerifyPayment,
    current_user: User = Depends(get_current_company_user),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    payment = verify_and_credit_payment(
        db, company,
        data.razorpay_order_id,
        data.razorpay_payment_id,
        data.razorpay_signature,
    )
    return {"success": True, "amount_credited": payment.amount, "new_balance": company.wallet_balance}


@router.get("/dashboard")
def company_dashboard(
    current_user: User = Depends(get_current_company_user),
    db: Session = Depends(get_db)
):
    from app.models.survey import Survey, SurveyResponse, SurveyStatus
    from sqlalchemy import func

    company = db.query(Company).filter(Company.user_id == current_user.id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    surveys = db.query(Survey).filter(Survey.company_id == company.id).all()
    active_count = sum(1 for s in surveys if s.status == SurveyStatus.ACTIVE)
    total_responses = sum(s.current_responses for s in surveys)

    return {
        "company": CompanyOut.model_validate(company),
        "stats": {
            "total_surveys": len(surveys),
            "active_surveys": active_count,
            "total_responses": total_responses,
            "wallet_balance": company.wallet_balance,
            "total_spent": company.total_spent,
        },
        "recent_surveys": [
            {
                "id": s.id,
                "title": s.title,
                "status": s.status,
                "responses": s.current_responses,
                "max_responses": s.max_responses,
                "reward_per_response": s.reward_per_response,
            }
            for s in sorted(surveys, key=lambda x: x.created_at, reverse=True)[:5]
        ]
    }


@router.get("/tier", response_model=UserOut)
def get_tier(
    current_user: User = Depends(get_current_company_user),
):
    """Return the current user's subscription tier."""
    return current_user


@router.patch("/tier", response_model=UserOut)
def set_tier(
    data: TierUpdate,
    current_user: User = Depends(get_current_company_user),
    db: Session = Depends(get_db),
):
    """Set or change the company's insight tier (pulse/compass/summit)."""
    tier = data.tier.lower()
    if tier not in VALID_TIERS:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Choose from: {', '.join(VALID_TIERS)}")
    current_user.subscription_tier = tier
    db.commit()
    db.refresh(current_user)
    return current_user
