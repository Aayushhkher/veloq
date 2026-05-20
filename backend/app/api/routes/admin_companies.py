from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_current_admin
from app.models.user import User
from app.models.company import Company
from app.schemas.schemas import CompanyOut

router = APIRouter(prefix="/admin/companies", tags=["Admin - Companies"])


@router.get("")
def list_all_companies(
    skip: int = 0,
    limit: int = 100,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    companies = db.query(Company).order_by(Company.created_at.desc()).offset(skip).limit(limit).all()
    return [CompanyOut.model_validate(c) for c in companies]
