from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from app.db.database import get_db
from app.core.security import get_current_admin
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.survey import Survey, SurveyStatus, SurveyResponse
from app.models.wallet import Withdrawal, WithdrawalStatus, Payment
from app.schemas.schemas import AdminStats, SurveyApprovalAction, WithdrawalAction, UserOut, SurveyListOut, WithdrawalOut
from app.services.wallet_service import process_withdrawal

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats", response_model=AdminStats)
def get_admin_stats(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    total_users = db.query(User).filter(User.role == UserRole.USER).count()
    total_companies = db.query(Company).count()
    total_surveys = db.query(Survey).count()
    active_surveys = db.query(Survey).filter(Survey.status == SurveyStatus.ACTIVE).count()
    total_responses = db.query(SurveyResponse).count()
    pending_withdrawals = db.query(Withdrawal).filter(Withdrawal.status == WithdrawalStatus.PENDING).count()

    total_revenue = db.query(func.sum(Payment.amount)).filter(Payment.status == "paid").scalar() or 0
    from app.core.config import settings

    total_user_earnings = db.query(func.sum(User.total_earned)).filter(User.role == UserRole.USER).scalar() or 0.0
    total_company_spent = db.query(func.sum(Company.total_spent)).scalar() or 0.0
    
    # Platform earnings calculated as the commission portion of total company spent
    platform_earnings = total_company_spent * (settings.PLATFORM_COMMISSION_PERCENT / (100 + settings.PLATFORM_COMMISSION_PERCENT))

    # Get earnings per user
    users = db.query(User).filter(User.role == UserRole.USER, User.total_earned > 0).all()
    earnings_per_user = {u.full_name or u.email: u.total_earned for u in users}

    # Get payments per company
    companies = db.query(Company).filter(Company.total_spent > 0).all()
    company_payments = {c.company_name: c.total_spent for c in companies}

    return AdminStats(
        total_users=total_users,
        total_companies=total_companies,
        total_surveys=total_surveys,
        active_surveys=active_surveys,
        total_responses=total_responses,
        total_revenue=total_revenue,
        pending_withdrawals=pending_withdrawals,
        platform_earnings=platform_earnings,
        total_user_earnings=total_user_earnings,
        total_company_spent=total_company_spent,
        earnings_per_user=earnings_per_user,
        company_payments=company_payments
    )


@router.get("/users")
def list_users(
    skip: int = 0, limit: int = 50,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return [UserOut.model_validate(u) for u in users]


@router.get("/surveys")
def list_all_surveys(
    skip: int = 0, limit: int = 50,
    status: str = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Survey)
    if status:
        query = query.filter(Survey.status == status)
    surveys = query.order_by(Survey.created_at.desc()).offset(skip).limit(limit).all()
    result = []
    for s in surveys:
        company = db.query(Company).filter(Company.id == s.company_id).first()
        item = {
            "id": s.id,
            "title": s.title,
            "status": s.status,
            "company_name": company.company_name if company else "Unknown",
            "reward_per_response": s.reward_per_response,
            "max_responses": s.max_responses,
            "current_responses": s.current_responses,
            "total_budget": s.total_budget,
            "created_at": s.created_at,
        }
        result.append(item)
    return result


@router.post("/surveys/{survey_id}/action")
def approve_reject_survey(
    survey_id: int,
    data: SurveyApprovalAction,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    survey = db.query(Survey).filter(Survey.id == survey_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    if data.action == "approve":
        survey.status = SurveyStatus.ACTIVE
        survey.is_active = True
        survey.rejection_reason = None
    elif data.action == "reject":
        survey.status = SurveyStatus.REJECTED
        survey.is_active = False
        survey.rejection_reason = data.rejection_reason
        # Refund company
        company = db.query(Company).filter(Company.id == survey.company_id).first()
        if company:
            from app.core.config import settings
            commission = survey.total_budget * (settings.PLATFORM_COMMISSION_PERCENT / 100)
            company.wallet_balance += survey.total_budget + commission
            company.total_spent -= (survey.total_budget + commission)
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    db.commit()
    return {"success": True, "survey_id": survey_id, "new_status": survey.status}


@router.get("/withdrawals")
def list_withdrawals(
    skip: int = 0, limit: int = 50,
    status: str = None,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    query = db.query(Withdrawal)
    if status:
        query = query.filter(Withdrawal.status == status)
    withdrawals = query.order_by(Withdrawal.requested_at.desc()).offset(skip).limit(limit).all()
    result = []
    for w in withdrawals:
        user = db.query(User).filter(User.id == w.user_id).first()
        result.append({
            "id": w.id,
            "user_name": user.full_name if user else "Unknown",
            "user_email": user.email if user else "Unknown",
            "amount": w.amount,
            "upi_id": w.upi_id,
            "status": w.status,
            "requested_at": w.requested_at,
            "processed_at": w.processed_at,
        })
    return result


@router.post("/withdrawals/{withdrawal_id}/action")
def handle_withdrawal(
    withdrawal_id: int,
    data: WithdrawalAction,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    withdrawal = process_withdrawal(db, withdrawal_id, data.action, data.admin_notes)
    return {"success": True, "withdrawal_id": withdrawal_id, "new_status": withdrawal.status}


@router.patch("/users/{user_id}/toggle")
def toggle_user_status(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"user_id": user_id, "is_active": user.is_active}
