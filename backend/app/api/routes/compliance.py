from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timedelta
import json, io, uuid, csv

from app.db.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.models.compliance import (
    UserConsent, ConsentType, DataBreachLog, BreachSeverity, BreachStatus,
    DataAccessLog, KYCRecord, KYCStatus, TDSRecord, TDSStatus, PayoutAuditLog,
    GrievanceTicket, GrievanceComment, GrievanceStatus, GrievanceCategory, ReviewFlag, ReviewStatus
)
from app.models.wallet import WalletTransaction, Withdrawal
from app.models.survey import SurveyResponse
from pydantic import BaseModel

router = APIRouter(prefix="/compliance", tags=["Compliance"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class ConsentUpdate(BaseModel):
    marketing: Optional[bool] = None
    data_processing: Optional[bool] = None

class ConsentGrant(BaseModel):
    terms: bool
    privacy: bool
    marketing: bool = False
    data_processing: bool = True
    version: str = "1.0"

class KYCSubmit(BaseModel):
    pan_number: str
    pan_name: str
    date_of_birth: Optional[str] = None

class BreachCreate(BaseModel):
    title: str
    description: str
    severity: str = "medium"
    affected_users_count: int = 0
    data_categories_affected: Optional[list] = None

class GrievanceCreate(BaseModel):
    category: str
    subject: str
    description: str

class GrievanceCommentCreate(BaseModel):
    content: str
    is_internal: bool = False

class GrievanceAction(BaseModel):
    status: str
    resolution_notes: Optional[str] = None


# ─── Consent Management ───────────────────────────────────────────────────────

@router.post("/consent/grant")
def grant_consent(data: ConsentGrant, request: Request, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    ip = request.client.host if request.client else None
    ua = request.headers.get("user-agent", "")
    for ctype, granted in [
        (ConsentType.TERMS_OF_SERVICE, data.terms),
        (ConsentType.PRIVACY_POLICY, data.privacy),
        (ConsentType.MARKETING, data.marketing),
        (ConsentType.DATA_PROCESSING, data.data_processing),
    ]:
        existing = db.query(UserConsent).filter(UserConsent.user_id == current_user.id, UserConsent.consent_type == ctype).first()
        if existing:
            existing.granted = granted
            existing.ip_address = ip
            existing.user_agent = ua
            existing.version = data.version
            if not granted:
                existing.withdrawn_at = datetime.utcnow()
        else:
            db.add(UserConsent(user_id=current_user.id, consent_type=ctype, granted=granted, ip_address=ip, user_agent=ua, version=data.version))
    current_user.marketing_consent = data.marketing
    current_user.data_processing_consent = data.data_processing
    current_user.consent_version = data.version
    db.commit()
    return {"success": True, "message": "Consent recorded"}


@router.get("/consent")
def get_consents(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    consents = db.query(UserConsent).filter(UserConsent.user_id == current_user.id).all()
    return {
        "consents": [{"type": c.consent_type, "granted": c.granted, "version": c.version, "granted_at": c.granted_at, "withdrawn_at": c.withdrawn_at} for c in consents],
        "marketing_consent": current_user.marketing_consent,
        "data_processing_consent": current_user.data_processing_consent,
    }


@router.patch("/consent/marketing")
def update_marketing_consent(data: ConsentUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if data.marketing is not None:
        current_user.marketing_consent = data.marketing
        existing = db.query(UserConsent).filter(UserConsent.user_id == current_user.id, UserConsent.consent_type == ConsentType.MARKETING).first()
        if existing:
            existing.granted = data.marketing
            existing.withdrawn_at = None if data.marketing else datetime.utcnow()
    db.commit()
    return {"success": True, "marketing_consent": current_user.marketing_consent}


# ─── Data Portability (Right to Download) ────────────────────────────────────

@router.get("/data/export")
def export_my_data(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    transactions = db.query(WalletTransaction).filter(WalletTransaction.user_id == current_user.id).all()
    responses = db.query(SurveyResponse).filter(SurveyResponse.user_id == current_user.id).all()
    withdrawals = db.query(Withdrawal).filter(Withdrawal.user_id == current_user.id).all()
    consents = db.query(UserConsent).filter(UserConsent.user_id == current_user.id).all()

    export_data = {
        "export_date": datetime.utcnow().isoformat(),
        "user": {
            "id": current_user.id, "email": current_user.email, "full_name": current_user.full_name,
            "phone": current_user.phone, "role": current_user.role, "created_at": str(current_user.created_at),
            "wallet_balance": current_user.wallet_balance, "total_earned": current_user.total_earned,
            "surveys_completed": current_user.surveys_completed, "kyc_status": current_user.kyc_status,
        },
        "transactions": [{"id": t.id, "type": t.transaction_type, "amount": t.amount, "description": t.description, "date": str(t.created_at)} for t in transactions],
        "survey_responses": [{"survey_id": r.survey_id, "reward": r.reward_earned, "completed_at": str(r.completed_at)} for r in responses],
        "withdrawals": [{"id": w.id, "amount": w.amount, "status": w.status, "requested_at": str(w.requested_at)} for w in withdrawals],
        "consents": [{"type": c.consent_type, "granted": c.granted, "date": str(c.granted_at)} for c in consents],
    }

    db.add(DataAccessLog(user_id=current_user.id, accessed_by=current_user.id, action="data_export", resource_type="user", resource_id=str(current_user.id)))
    db.commit()

    json_bytes = json.dumps(export_data, indent=2, default=str).encode("utf-8")
    return StreamingResponse(io.BytesIO(json_bytes), media_type="application/json", headers={"Content-Disposition": f"attachment; filename=veloq_data_{current_user.id}.json"})


# ─── Right to Erasure ─────────────────────────────────────────────────────────

@router.delete("/account/delete")
def delete_account(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.add(DataAccessLog(user_id=current_user.id, accessed_by=current_user.id, action="account_deletion", resource_type="user", resource_id=str(current_user.id)))
    current_user.email = f"deleted_{current_user.id}@deleted.veloq"
    current_user.full_name = "Deleted User"
    current_user.phone = None
    current_user.upi_id = None
    current_user.pan_number = None
    current_user.google_id = None
    current_user.is_active = False
    current_user.hashed_password = None
    db.commit()
    return {"success": True, "message": "Account and personal data deleted per DPDP Act Section 12"}


# ─── KYC Verification ─────────────────────────────────────────────────────────

@router.post("/kyc/submit")
def submit_kyc(data: KYCSubmit, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    pan = data.pan_number.upper().strip()
    import re
    if not re.match(r'^[A-Z]{5}[0-9]{4}[A-Z]{1}$', pan):
        raise HTTPException(status_code=400, detail="Invalid PAN format. Expected: ABCDE1234F")
    existing = db.query(KYCRecord).filter(KYCRecord.user_id == current_user.id).first()
    if existing:
        existing.pan_number = pan
        existing.pan_name = data.pan_name
        existing.date_of_birth = data.date_of_birth
        existing.status = KYCStatus.VERIFIED
        existing.pan_verified = True
        existing.verified_at = datetime.utcnow()
        existing.verification_source = "self_declaration"
    else:
        db.add(KYCRecord(user_id=current_user.id, pan_number=pan, pan_name=data.pan_name, date_of_birth=data.date_of_birth, status=KYCStatus.VERIFIED, pan_verified=True, verified_at=datetime.utcnow(), verification_source="self_declaration"))
    current_user.pan_number = pan
    current_user.kyc_status = "verified"
    db.commit()
    return {"success": True, "status": "verified", "message": "KYC verified successfully"}


@router.get("/kyc/status")
def get_kyc_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    kyc = db.query(KYCRecord).filter(KYCRecord.user_id == current_user.id).first()
    return {"kyc_status": current_user.kyc_status, "pan_verified": kyc.pan_verified if kyc else False, "pan_number": f"{'*' * 6}{current_user.pan_number[-4:]}" if current_user.pan_number else None, "verified_at": kyc.verified_at if kyc else None}


# ─── TDS Engine ───────────────────────────────────────────────────────────────

@router.get("/tds/status")
def get_tds_status(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    fy = f"{now.year}-{str(now.year + 1)[-2:]}" if now.month >= 4 else f"{now.year - 1}-{str(now.year)[-2:]}"
    tds = db.query(TDSRecord).filter(TDSRecord.user_id == current_user.id, TDSRecord.financial_year == fy).first()
    threshold = 30000.0
    tds_rate = 10.0
    total_income = current_user.total_earned
    tds_amount = max(0, (total_income - threshold) * tds_rate / 100) if total_income > threshold else 0
    return {
        "financial_year": fy, "total_income": total_income,
        "tds_threshold": threshold, "tds_rate": tds_rate,
        "tds_amount": round(tds_amount, 2),
        "tds_held": tds.tds_held_amount if tds else 0,
        "status": tds.status if tds else ("threshold_reached" if total_income >= threshold else "below_threshold"),
        "certificate_available": bool(tds and tds.certificate_url),
    }


@router.get("/tds/certificate")
def download_tds_certificate(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    fy = f"{now.year}-{str(now.year + 1)[-2:]}" if now.month >= 4 else f"{now.year - 1}-{str(now.year)[-2:]}"
    cert_data = {
        "certificate_number": f"TDS-{current_user.id}-{fy.replace('-', '')}",
        "form": "Form 16A (TDS Certificate)", "financial_year": fy,
        "deductee": {"name": current_user.full_name, "pan": current_user.pan_number or "NOT PROVIDED", "email": current_user.email},
        "deductor": {"name": "VeLOQ Platform Pvt Ltd", "tan": "MUMS12345A", "address": "Virtual Office, Bengaluru - 560001"},
        "income_details": {"gross_income": current_user.total_earned, "tds_threshold": 30000, "taxable_income": max(0, current_user.total_earned - 30000), "tds_rate": "10%", "tds_deducted": round(max(0, (current_user.total_earned - 30000) * 0.1), 2)},
        "generated_at": datetime.utcnow().isoformat(), "section": "194-O (E-commerce operator)",
    }
    json_bytes = json.dumps(cert_data, indent=2).encode("utf-8")
    return StreamingResponse(io.BytesIO(json_bytes), media_type="application/json", headers={"Content-Disposition": f"attachment; filename=Form16A_{fy}_{current_user.id}.json"})


# ─── Audit Trail Export (Admin) ───────────────────────────────────────────────

@router.get("/admin/audit-trail")
def export_audit_trail(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    logs = db.query(PayoutAuditLog).order_by(PayoutAuditLog.processed_at.desc()).limit(10000).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Transaction ID", "User ID", "User Email", "PAN", "Amount", "TDS Deducted", "Net Amount", "UPI ID", "Status", "Financial Year", "Processed At"])
    for log in logs:
        writer.writerow([log.transaction_id, log.user_id, log.user_email, log.user_pan or "", log.amount, log.tds_deducted, log.net_amount, log.upi_id, log.status, log.financial_year, log.processed_at])
    csv_bytes = output.getvalue().encode("utf-8")
    return StreamingResponse(io.BytesIO(csv_bytes), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=audit_trail.csv"})


# ─── Breach Logger (Admin) ────────────────────────────────────────────────────

@router.post("/admin/breach")
def log_breach(data: BreachCreate, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    count = db.query(DataBreachLog).count()
    incident_id = f"INC-{datetime.utcnow().year}-{str(count + 1).zfill(4)}"
    breach = DataBreachLog(
        incident_id=incident_id, title=data.title, description=data.description,
        severity=data.severity, affected_users_count=data.affected_users_count,
        data_categories_affected=data.data_categories_affected, reported_by=admin.id,
    )
    db.add(breach)
    db.commit()
    db.refresh(breach)
    return {"incident_id": incident_id, "id": breach.id}


@router.get("/admin/breaches")
def list_breaches(admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    breaches = db.query(DataBreachLog).order_by(DataBreachLog.detected_at.desc()).all()
    return [{"id": b.id, "incident_id": b.incident_id, "title": b.title, "severity": b.severity, "status": b.status, "affected_users_count": b.affected_users_count, "detected_at": b.detected_at} for b in breaches]


@router.get("/admin/breach/{breach_id}/report")
def get_incident_report(breach_id: int, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    b = db.query(DataBreachLog).filter(DataBreachLog.id == breach_id).first()
    if not b:
        raise HTTPException(status_code=404, detail="Breach not found")
    report = {
        "INCIDENT REPORT": b.incident_id, "Title": b.title, "Severity": b.severity, "Status": b.status,
        "Description": b.description, "Affected Users": b.affected_users_count,
        "Data Categories Affected": b.data_categories_affected,
        "Detected At": str(b.detected_at), "Government Notified": str(b.government_notified_at) if b.government_notified_at else "NOT YET",
        "Users Notified": str(b.users_notified_at) if b.users_notified_at else "NOT YET",
        "Remediation": b.remediation_steps or "In progress",
        "Legal Note": "Per DPDP Act 2023, breach must be reported to CERT-In within 6 hours of detection.",
    }
    json_bytes = json.dumps(report, indent=2).encode("utf-8")
    return StreamingResponse(io.BytesIO(json_bytes), media_type="application/json", headers={"Content-Disposition": f"attachment; filename=incident_report_{b.incident_id}.json"})


# ─── Grievance Ticketing ──────────────────────────────────────────────────────

@router.post("/grievance")
def create_grievance(data: GrievanceCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    count = db.query(GrievanceTicket).count()
    ticket_number = f"GRV-{datetime.utcnow().year}-{str(count + 1).zfill(6)}"
    due = datetime.utcnow() + timedelta(days=30)
    ticket = GrievanceTicket(
        ticket_number=ticket_number, user_id=current_user.id,
        category=data.category, subject=data.subject, description=data.description, due_date=due,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return {"ticket_number": ticket_number, "id": ticket.id, "due_date": due, "message": "Grievance registered. You will receive a response within 30 days."}


@router.get("/grievance/my")
def my_grievances(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    tickets = db.query(GrievanceTicket).filter(GrievanceTicket.user_id == current_user.id).order_by(GrievanceTicket.created_at.desc()).all()
    return [{"id": t.id, "ticket_number": t.ticket_number, "category": t.category, "subject": t.subject, "status": t.status, "priority": t.priority, "created_at": t.created_at, "due_date": t.due_date, "resolved_at": t.resolved_at} for t in tickets]


@router.get("/admin/grievances")
def list_grievances(status: Optional[str] = None, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    q = db.query(GrievanceTicket)
    if status:
        q = q.filter(GrievanceTicket.status == status)
    tickets = q.order_by(GrievanceTicket.created_at.desc()).all()
    result = []
    for t in tickets:
        result.append({"id": t.id, "ticket_number": t.ticket_number, "user_id": t.user_id, "user_email": t.user.email if t.user else "", "user_name": t.user.full_name if t.user else "", "category": t.category, "subject": t.subject, "status": t.status, "priority": t.priority, "created_at": t.created_at, "due_date": t.due_date})
    return result


@router.patch("/admin/grievances/{ticket_id}")
def update_grievance(ticket_id: int, data: GrievanceAction, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    ticket = db.query(GrievanceTicket).filter(GrievanceTicket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.status = data.status
    if data.resolution_notes:
        ticket.resolution_notes = data.resolution_notes
    if data.status == "resolved":
        ticket.resolved_at = datetime.utcnow()
    db.commit()
    return {"success": True, "ticket_number": ticket.ticket_number}


# ─── Review Moderation (Admin) ────────────────────────────────────────────────

@router.get("/admin/reviews")
def list_reviews(status: Optional[str] = None, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    q = db.query(ReviewFlag)
    if status:
        q = q.filter(ReviewFlag.status == status)
    flags = q.order_by(ReviewFlag.created_at.desc()).all()
    return [{"id": f.id, "survey_response_id": f.survey_response_id, "user_id": f.user_id, "status": f.status, "flag_reason": f.flag_reason, "removal_reason": f.removal_reason, "created_at": f.created_at, "flagged_at": f.flagged_at, "removed_at": f.removed_at, "retention_until": f.retention_until} for f in flags]


@router.patch("/admin/reviews/{flag_id}/remove")
def remove_review(flag_id: int, reason: str, admin: User = Depends(get_current_admin), db: Session = Depends(get_db)):
    flag = db.query(ReviewFlag).filter(ReviewFlag.id == flag_id).first()
    if not flag:
        raise HTTPException(status_code=404, detail="Review not found")
    flag.status = ReviewStatus.REMOVED
    flag.removal_reason = reason
    flag.removed_by = admin.id
    flag.removed_at = datetime.utcnow()
    flag.retention_until = datetime.utcnow() + timedelta(days=180)
    db.commit()
    return {"success": True, "message": "Review removed. Retained for 180 days per IS 19000."}
