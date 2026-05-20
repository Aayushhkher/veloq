from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import httpx
from app.models.user import User, UserRole
from app.models.company import Company
from app.core.security import verify_password, get_password_hash, create_access_token
from app.core.config import settings
from app.schemas.schemas import UserRegister, UserLogin


def register_user(db: Session, data: UserRegister) -> User:
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    role = UserRole.COMPANY if data.role == "company" else UserRole.USER

    user = User(
        email=data.email,
        full_name=data.full_name,
        hashed_password=get_password_hash(data.password),
        role=role,
        is_verified=True,
    )
    db.add(user)
    db.flush()

    if role == UserRole.COMPANY:
        company = Company(
            user_id=user.id,
            company_name=data.full_name,
        )
        db.add(company)

    db.commit()
    db.refresh(user)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is inactive")
    return user


async def get_google_user_info(code: str, redirect_uri: str) -> dict:
    # Exchange code for token
    token_url = "https://oauth2.googleapis.com/token"
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(token_url, data={
            "code": code,
            "client_id": settings.GOOGLE_CLIENT_ID,
            "client_secret": settings.GOOGLE_CLIENT_SECRET,
            "redirect_uri": redirect_uri or settings.GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        })
        if token_resp.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to exchange Google code")

        token_data = token_resp.json()
        access_token = token_data.get("access_token")

        # Get user info
        user_resp = await client.get(
            "https://www.googleapis.com/oauth2/v2/userinfo",
            headers={"Authorization": f"Bearer {access_token}"}
        )
        return user_resp.json()


def get_or_create_google_user(db: Session, google_data: dict) -> User:
    google_id = google_data.get("id")
    email = google_data.get("email")

    user = db.query(User).filter(User.google_id == google_id).first()
    if not user:
        user = db.query(User).filter(User.email == email).first()

    if user:
        if not user.google_id:
            user.google_id = google_id
            user.avatar_url = google_data.get("picture")
            db.commit()
        return user

    # Create new user
    user = User(
        email=email,
        full_name=google_data.get("name", email.split("@")[0]),
        google_id=google_id,
        avatar_url=google_data.get("picture"),
        role=UserRole.USER,
        is_verified=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
