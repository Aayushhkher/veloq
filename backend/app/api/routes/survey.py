from fastapi import APIRouter, Depends, Request, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.core.security import get_current_user, get_current_company_user
from app.models.user import User, UserRole
from app.models.company import Company
from app.schemas.schemas import SurveyCreate, SurveyOut, SurveyListOut, SurveySubmit, SurveyResponseOut
from app.services.survey_service import (
    create_survey, get_available_surveys, get_survey_with_questions,
    submit_survey, get_company_surveys, get_survey_analytics
)

router = APIRouter(prefix="/survey", tags=["Surveys"])


@router.get("/available", response_model=List[SurveyListOut])
def list_available_surveys(
    skip: int = 0,
    limit: int = 20,
    category: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    surveys = get_available_surveys(db, current_user.id, skip, limit, category)
    result = []
    for s in surveys:
        company = db.query(Company).filter(Company.id == s.company_id).first()
        item = SurveyListOut.model_validate(s)
        item.company_name = company.company_name if company else None
        result.append(item)
    return result


@router.get("/{survey_id}", response_model=SurveyOut)
def get_survey(
    survey_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    survey = get_survey_with_questions(db, survey_id)
    company = db.query(Company).filter(Company.id == survey.company_id).first()
    result = SurveyOut.model_validate(survey)
    result.company_name = company.company_name if company else None
    return result


@router.post("/{survey_id}/submit", response_model=SurveyResponseOut)
def submit_survey_response(
    survey_id: int,
    data: SurveySubmit,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ip = request.client.host if request.client else "unknown"
    return submit_survey(db, survey_id, current_user, data, ip)


# Company survey management
@router.post("/company/create", response_model=SurveyOut)
def create_company_survey(
    data: SurveyCreate,
    current_user: User = Depends(get_current_company_user),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.user_id == current_user.id).first()
    if not company:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Company profile not found")
    return create_survey(db, company, data)


@router.get("/company/list", response_model=List[SurveyListOut])
def list_company_surveys(
    skip: int = 0,
    limit: int = 20,
    current_user: User = Depends(get_current_company_user),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.user_id == current_user.id).first()
    if not company:
        return []
    surveys = get_company_surveys(db, company.id, skip, limit)
    result = []
    for s in surveys:
        item = SurveyListOut.model_validate(s)
        item.company_name = company.company_name
        result.append(item)
    return result


@router.get("/company/{survey_id}/analytics")
def survey_analytics(
    survey_id: int,
    current_user: User = Depends(get_current_company_user),
    db: Session = Depends(get_db)
):
    company = db.query(Company).filter(Company.user_id == current_user.id).first()
    if not company:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Company not found")
    return get_survey_analytics(db, survey_id, company.id)
