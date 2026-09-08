from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:password@localhost:5432/surveymarket"
    REDIS_URL: str = "redis://localhost:6379/0"
    SECRET_KEY: str = "your-super-secret-jwt-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440

    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/auth/google/callback"

    RAZORPAY_KEY_ID: str = ""
    RAZORPAY_KEY_SECRET: str = ""

    FRONTEND_URL: str = "http://localhost:3000"
    PLATFORM_COMMISSION_PERCENT: float = 10.0
    MIN_WITHDRAWAL_AMOUNT: float = 100.0

    GEMINI_API_KEY: Optional[str] = None

    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    class Config:
        env_file = ".env"


settings = Settings()
