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
    from app.services.verification_service import VerificationService
    from app.models.wallet import TransactionStatus

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

    # Run verification/AI quality checks
    quality_score, is_flagged, flag_reasons = VerificationService.verify_response(
        db=db,
        survey=survey,
        answers=data.answers,
        time_taken_seconds=data.time_taken_seconds,
        paste_count=data.paste_count,
        pasted_questions=data.pasted_questions
    )

    # Severe quality failure -> Block submission entirely
    if quality_score < 0.3:
        raise HTTPException(
            status_code=400,
            detail="Submission blocked: Automated system detected AI-generated, bot-like, or low-quality responses. Please answer honestly."
        )

    response_status = "flagged" if is_flagged else "approved"

    # Create response
    response = SurveyResponse(
        survey_id=survey_id,
        user_id=user.id,
        answers=data.answers,
        reward_earned=survey.reward_per_response,
        ip_address=ip_address,
        time_taken_seconds=data.time_taken_seconds,
        is_flagged=is_flagged,
        flag_reasons=flag_reasons,
        quality_score=quality_score,
        status=response_status
    )
    db.add(response)

    # Update survey progress
    survey.current_responses += 1
    if survey.current_responses >= survey.max_responses:
        survey.status = SurveyStatus.COMPLETED
        survey.is_active = False

    if not is_flagged:
        # Credit user wallet instantly for approved responses
        user.wallet_balance += survey.reward_per_response
        user.total_earned += survey.reward_per_response
        user.surveys_completed += 1

        # Create completed wallet transaction
        txn = WalletTransaction(
            user_id=user.id,
            transaction_type=TransactionType.SURVEY_REWARD,
            amount=survey.reward_per_response,
            balance_after=user.wallet_balance,
            description=f"Reward for completing: {survey.title}",
            reference_id=str(survey_id),
            status=TransactionStatus.COMPLETED
        )
        db.add(txn)
    else:
        # Withhold reward and create pending transaction for flagged responses
        txn = WalletTransaction(
            user_id=user.id,
            transaction_type=TransactionType.SURVEY_REWARD,
            amount=survey.reward_per_response,
            balance_after=user.wallet_balance, # balance doesn't change yet
            description=f"Under Quality Review: {survey.title}",
            reference_id=str(survey_id),
            status=TransactionStatus.PENDING
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
            question_analytics[q_id] = {
                "type": q.question_type,
                "question_text": q.question_text,
                "options": q.options or [],
                "distribution": dict(counts),
                "total": len(answers)
            }
        elif q.question_type == "rating":
            avg = sum(float(a) for a in answers if a) / len(answers) if answers else 0
            # Also calculate count per rating (1-5)
            from collections import Counter
            counts = Counter([str(a) for a in answers if a is not None])
            question_analytics[q_id] = {
                "type": "rating",
                "question_text": q.question_text,
                "average": round(avg, 2),
                "distribution": dict(counts),
                "total": len(answers)
            }
        else:
            question_analytics[q_id] = {
                "type": q.question_type,
                "question_text": q.question_text,
                "total": len(answers),
                "sample": answers[:10]
            }

    # Compile all responses for drilldown and quality review
    responses_list = []
    sorted_responses = sorted(responses, key=lambda x: x.completed_at if x.completed_at else func.now(), reverse=True)
    for r in sorted_responses:
        u = db.query(User).filter(User.id == r.user_id).first()
        responses_list.append({
            "id": r.id,
            "user_id": r.user_id,
            "user_name": u.full_name if u else "Anonymous User",
            "user_email": u.email if u else "anonymous@veloq.com",
            "completed_at": r.completed_at.isoformat() if r.completed_at else None,
            "time_taken_seconds": r.time_taken_seconds,
            "ip_address": r.ip_address,
            "is_flagged": r.is_flagged,
            "flag_reasons": r.flag_reasons or [],
            "quality_score": r.quality_score,
            "status": r.status,
            "answers": r.answers or {},
        })

    questions_meta = [
        {
            "id": q.id,
            "question_text": q.question_text,
            "question_type": q.question_type,
            "options": q.options or [],
            "order": q.order
        }
        for q in sorted(questions, key=lambda x: x.order)
    ]

    return {
        "survey_id": survey_id,
        "title": survey.title,
        "description": survey.description,
        "category": survey.category,
        "reward_per_response": survey.reward_per_response,
        "total_responses": survey.current_responses,
        "max_responses": survey.max_responses,
        "completion_rate": round((survey.current_responses / max(survey.max_responses, 1)) * 100, 1) if survey.max_responses > 0 else 0,
        "total_spent": survey.reward_per_response * survey.current_responses,
        "questions": questions_meta,
        "question_analytics": question_analytics,
        "recent_responses": responses_list,
        "total_submissions_count": len(responses)
    }


def export_survey_responses_csv(db: Session, survey_id: int, company_id: int) -> str:
    import csv
    import io

    survey = db.query(Survey).filter(Survey.id == survey_id, Survey.company_id == company_id).first()
    if not survey:
        raise HTTPException(status_code=404, detail="Survey not found")

    questions = db.query(SurveyQuestion).filter(SurveyQuestion.survey_id == survey_id).order_by(SurveyQuestion.order).all()
    responses = db.query(SurveyResponse).filter(SurveyResponse.survey_id == survey_id).order_by(SurveyResponse.completed_at.desc()).all()

    output = io.StringIO()
    writer = csv.writer(output)

    # Header row: Response ID, User Name, User Email, Completed At, Time Taken (s), Quality Score, Status, [Question 1, Question 2, ...]
    headers = ["Response ID", "User Name", "User Email", "Completed At", "Time Taken (s)", "Quality Score (%)", "Status"]
    for q in questions:
        headers.append(f"Q: {q.question_text}")
    writer.writerow(headers)

    for r in responses:
        u = db.query(User).filter(User.id == r.user_id).first()
        row = [
            r.id,
            u.full_name if u else "Anonymous",
            u.email if u else "anonymous@veloq.com",
            r.completed_at.isoformat() if r.completed_at else "",
            r.time_taken_seconds or "",
            round((r.quality_score or 1.0) * 100),
            r.status or "approved"
        ]
        for q in questions:
            ans = (r.answers or {}).get(str(q.id))
            if ans is None:
                row.append("")
            elif isinstance(ans, list):
                row.append("; ".join(str(item) for item in ans))
            else:
                row.append(str(ans))
        writer.writerow(row)

    return output.getvalue()


def approve_survey_response(db: Session, response_id: int, company_id: int) -> dict:
    from app.models.wallet import WalletTransaction, TransactionStatus, TransactionType

    response = db.query(SurveyResponse).filter(SurveyResponse.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")

    survey = db.query(Survey).filter(Survey.id == response.survey_id).first()
    if not survey or survey.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not authorized to approve this response")

    if response.status != "flagged":
        raise HTTPException(status_code=400, detail="Only flagged responses can be approved")

    # Update response status
    response.status = "approved"

    # Credit user wallet
    user = db.query(User).filter(User.id == response.user_id).first()
    if user:
        user.wallet_balance += response.reward_earned
        user.total_earned += response.reward_earned
        user.surveys_completed += 1

        # Complete the pending wallet transaction
        txn = db.query(WalletTransaction).filter(
            WalletTransaction.user_id == user.id,
            WalletTransaction.reference_id == str(survey.id),
            WalletTransaction.status == TransactionStatus.PENDING
        ).first()
        if txn:
            txn.status = TransactionStatus.COMPLETED
            txn.balance_after = user.wallet_balance
            txn.description = f"Reward for completing (Approved): {survey.title}"
        else:
            txn = WalletTransaction(
                user_id=user.id,
                transaction_type=TransactionType.SURVEY_REWARD,
                amount=response.reward_earned,
                balance_after=user.wallet_balance,
                description=f"Reward for completing (Approved): {survey.title}",
                reference_id=str(survey.id),
                status=TransactionStatus.COMPLETED
            )
            db.add(txn)

    db.commit()
    return {"status": "success", "message": "Response approved and user rewarded"}


def reject_survey_response(db: Session, response_id: int, company_id: int) -> dict:
    from app.models.wallet import WalletTransaction, TransactionStatus

    response = db.query(SurveyResponse).filter(SurveyResponse.id == response_id).first()
    if not response:
        raise HTTPException(status_code=404, detail="Response not found")

    survey = db.query(Survey).filter(Survey.id == response.survey_id).first()
    if not survey or survey.company_id != company_id:
        raise HTTPException(status_code=403, detail="Not authorized to reject this response")

    if response.status != "flagged":
        raise HTTPException(status_code=400, detail="Only flagged responses can be rejected")

    # Update response status
    response.status = "rejected"

    # Free up slot in survey responses
    if survey.current_responses > 0:
        survey.current_responses -= 1
        if survey.status == SurveyStatus.COMPLETED:
            survey.status = SurveyStatus.ACTIVE
            survey.is_active = True

    # Mark transaction as failed
    user = db.query(User).filter(User.id == response.user_id).first()
    if user:
        txn = db.query(WalletTransaction).filter(
            WalletTransaction.user_id == user.id,
            WalletTransaction.reference_id == str(survey.id),
            WalletTransaction.status == TransactionStatus.PENDING
        ).first()
        if txn:
            txn.status = TransactionStatus.FAILED
            txn.description = f"Rejected: Low Quality Response for {survey.title}"

    db.commit()
    return {"status": "success", "message": "Response rejected and slot freed"}
