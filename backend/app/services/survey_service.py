from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, and_
from fastapi import HTTPException
from typing import List, Optional
from app.models.survey import Survey, SurveyQuestion, SurveyResponse, SurveyStatus
from app.models.company import Company
from app.models.user import User
from app.models.wallet import WalletTransaction, TransactionType
from app.schemas.schemas import SurveyCreate, SurveySubmit
from app.core.config import settings


def create_survey(db: Session, company: Company, data: SurveyCreate) -> Survey:
    total_budget = data.reward_per_response * data.max_responses
    commission = total_budget * (settings.PLATFORM_COMMISSION_PERCENT / 100)
    total_required = total_budget + commission

    if company.wallet_balance < total_required:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient balance. Required: ₹{total_required:.2f} (including {settings.PLATFORM_COMMISSION_PERCENT}% platform fee), Available: ₹{company.wallet_balance:.2f}"
        )

    # Deduct budget from company wallet
    company.wallet_balance -= total_required
    company.total_spent += total_required

    survey = Survey(
        company_id=company.id,
        title=data.title,
        description=data.description,
        category=data.category,
        reward_per_response=data.reward_per_response,
        max_responses=data.max_responses,
        total_budget=total_budget,
        estimated_time_minutes=data.estimated_time_minutes,
        target_demographics=data.target_demographics,
        status=SurveyStatus.PENDING,
    )
    db.add(survey)
    db.flush()

    for q in data.questions:
        question = SurveyQuestion(
            survey_id=survey.id,
            question_text=q.question_text,
            question_type=q.question_type,
            options=q.options,
            is_required=q.is_required,
            order=q.order,
            min_value=q.min_value,
            max_value=q.max_value,
        )
        db.add(question)

    db.commit()
    db.refresh(survey)
    return survey


def get_available_surveys(db: Session, user_id: int, skip: int = 0, limit: int = 20, category: Optional[str] = None) -> List[Survey]:
    # Get surveys user hasn't completed
    completed_ids = db.query(SurveyResponse.survey_id).filter(
        SurveyResponse.user_id == user_id
    ).subquery()

    query = db.query(Survey).filter(
        Survey.status == SurveyStatus.ACTIVE,
        Survey.is_active == True,
        ~Survey.id.in_(completed_ids),
        Survey.current_responses < Survey.max_responses,
    )

    if category:
        query = query.filter(Survey.category == category)

    return query.offset(skip).limit(limit).all()


def get_survey_with_questions(db: Session, survey_id: int) -> Survey:
    survey = db.query(Survey).options(
        joinedload(Survey.questions),
        joinedload(Survey.company)
    ).filter(Survey.id == survey_id).first()

    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    return survey


def submit_survey(db: Session, survey_id: int, user: User, data: SurveySubmit, ip_address: str) -> SurveyResponse:
    survey = db.query(Survey).filter(Survey.id == survey_id).with_for_update().first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")
    if not survey.is_active or survey.status != SurveyStatus.ACTIVE:
        raise HTTPException(status_code=400, detail="Survey is not active")
    if survey.current_responses >= survey.max_responses:
        raise HTTPException(status_code=400, detail="Survey has reached maximum responses")

    # Prevent duplicate submission
    existing = db.query(SurveyResponse).filter(
        and_(SurveyResponse.survey_id == survey_id, SurveyResponse.user_id == user.id)
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already completed this survey")

    # Validate required questions answered
    questions = db.query(SurveyQuestion).filter(SurveyQuestion.survey_id == survey_id).all()
    for q in questions:
        if q.is_required and str(q.id) not in data.answers:
            raise HTTPException(status_code=400, detail=f"Question {q.id} is required")

    # Create response
    response = SurveyResponse(
        survey_id=survey_id,
        user_id=user.id,
        answers=data.answers,
        reward_earned=survey.reward_per_response,
        ip_address=ip_address,
        time_taken_seconds=data.time_taken_seconds,
    )
    db.add(response)

    # Update survey progress
    survey.current_responses += 1
    if survey.current_responses >= survey.max_responses:
        survey.status = SurveyStatus.COMPLETED
        survey.is_active = False

    # Credit user wallet
    user.wallet_balance += survey.reward_per_response
    user.total_earned += survey.reward_per_response
    user.surveys_completed += 1

    # Create wallet transaction
    txn = WalletTransaction(
        user_id=user.id,
        transaction_type=TransactionType.SURVEY_REWARD,
        amount=survey.reward_per_response,
        balance_after=user.wallet_balance,
        description=f"Reward for completing: {survey.title}",
        reference_id=str(survey_id),
    )
    db.add(txn)

    db.commit()
    db.refresh(response)
    return response


def get_company_surveys(db: Session, company_id: int, skip: int = 0, limit: int = 20) -> List[Survey]:
    return db.query(Survey).filter(
        Survey.company_id == company_id
    ).order_by(Survey.created_at.desc()).offset(skip).limit(limit).all()


def get_survey_analytics(db: Session, survey_id: int, company_id: int) -> dict:
    survey = db.query(Survey).filter(
        Survey.id == survey_id,
        Survey.company_id == company_id
    ).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    responses = db.query(SurveyResponse).filter(SurveyResponse.survey_id == survey_id).all()

    # Aggregate answers per question
    question_analytics = {}
    questions = db.query(SurveyQuestion).filter(SurveyQuestion.survey_id == survey_id).all()

    for q in questions:
        q_id = str(q.id)
        answers = [r.answers.get(q_id) for r in responses if r.answers.get(q_id) is not None]
        if q.question_type in ["mcq", "checkbox"]:
            from collections import Counter
            counts = Counter()
            for a in answers:
                if isinstance(a, list):
                    for item in a:
                        counts[item] += 1
                else:
                    counts[a] += 1
            question_analytics[q_id] = {"type": q.question_type, "distribution": dict(counts), "total": len(answers)}
        elif q.question_type == "rating":
            avg = sum(float(a) for a in answers if a) / len(answers) if answers else 0
            question_analytics[q_id] = {"type": "rating", "average": round(avg, 2), "total": len(answers)}
        else:
            question_analytics[q_id] = {"type": q.question_type, "total": len(answers), "sample": answers[:5]}

    return {
        "survey_id": survey_id,
        "title": survey.title,
        "total_responses": survey.current_responses,
        "max_responses": survey.max_responses,
        "completion_rate": round((survey.current_responses / survey.max_responses) * 100, 1) if survey.max_responses > 0 else 0,
        "total_spent": survey.reward_per_response * survey.current_responses,
        "question_analytics": question_analytics,
    }
