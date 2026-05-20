from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.schemas import UserOut, UserUpdate, WalletTransactionOut, WithdrawalRequest, WithdrawalOut
from app.services.wallet_service import get_user_transactions, get_user_withdrawals, request_withdrawal

router = APIRouter(prefix="/user", tags=["User"])


@router.get("/profile", response_model=UserOut)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.patch("/profile", response_model=UserOut)
def update_profile(data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    for field, value in data.dict(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/wallet/transactions", response_model=List[WalletTransactionOut])
def get_transactions(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_user_transactions(db, current_user.id, skip, limit)


@router.post("/wallet/withdraw", response_model=WithdrawalOut)
def withdraw(
    data: WithdrawalRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return request_withdrawal(db, current_user, data.amount, data.upi_id)


@router.get("/wallet/withdrawals", response_model=List[WithdrawalOut])
def get_withdrawals(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return get_user_withdrawals(db, current_user.id, skip, limit)


@router.get("/completed-surveys")
def get_completed_surveys(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    from app.models.survey import SurveyResponse, Survey
    responses = db.query(SurveyResponse).filter(
        SurveyResponse.user_id == current_user.id
    ).order_by(SurveyResponse.completed_at.desc()).offset(skip).limit(limit).all()

    result = []
    for r in responses:
        survey = db.query(Survey).filter(Survey.id == r.survey_id).first()
        result.append({
            "response_id": r.id,
            "survey_id": r.survey_id,
            "survey_title": survey.title if survey else "Unknown",
            "reward_earned": r.reward_earned,
            "completed_at": r.completed_at,
        })
    return result
