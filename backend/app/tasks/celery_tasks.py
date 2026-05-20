from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "surveymarket",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "check-expired-surveys": {
            "task": "app.tasks.celery_tasks.check_expired_surveys",
            "schedule": 3600.0,  # Every hour
        },
        "generate-daily-analytics": {
            "task": "app.tasks.celery_tasks.generate_daily_analytics",
            "schedule": 86400.0,  # Every day
        },
    }
)


@celery_app.task(name="app.tasks.celery_tasks.check_expired_surveys")
def check_expired_surveys():
    from app.db.database import SessionLocal
    from app.models.survey import Survey, SurveyStatus
    from datetime import datetime

    db = SessionLocal()
    try:
        expired = db.query(Survey).filter(
            Survey.expires_at <= datetime.utcnow(),
            Survey.status == SurveyStatus.ACTIVE,
        ).all()
        for survey in expired:
            survey.status = SurveyStatus.COMPLETED
            survey.is_active = False
            # Refund unused budget
            company = survey.company
            if company:
                remaining = (survey.max_responses - survey.current_responses) * survey.reward_per_response
                if remaining > 0:
                    company.wallet_balance += remaining
        db.commit()
        return f"Expired {len(expired)} surveys"
    finally:
        db.close()


@celery_app.task(name="app.tasks.celery_tasks.generate_daily_analytics")
def generate_daily_analytics():
    from app.db.database import SessionLocal
    from app.models.survey import SurveyResponse
    from datetime import datetime, timedelta

    db = SessionLocal()
    try:
        yesterday = datetime.utcnow() - timedelta(days=1)
        count = db.query(SurveyResponse).filter(
            SurveyResponse.completed_at >= yesterday
        ).count()
        return f"Daily analytics: {count} responses"
    finally:
        db.close()


@celery_app.task(name="app.tasks.celery_tasks.fraud_detection")
def fraud_detection(user_id: int, survey_id: int, ip_address: str):
    """Basic fraud detection - check for suspicious patterns"""
    from app.db.database import SessionLocal
    from app.models.survey import SurveyResponse
    from datetime import datetime, timedelta

    db = SessionLocal()
    try:
        one_hour_ago = datetime.utcnow() - timedelta(hours=1)
        recent_from_ip = db.query(SurveyResponse).filter(
            SurveyResponse.ip_address == ip_address,
            SurveyResponse.completed_at >= one_hour_ago,
        ).count()

        if recent_from_ip > 10:
            # Flag user for review
            from app.models.user import User
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_active = False
                db.commit()
                return f"Flagged user {user_id} for suspicious activity"
        return "Clean"
    finally:
        db.close()
