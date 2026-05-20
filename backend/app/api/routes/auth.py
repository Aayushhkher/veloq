from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import create_access_token, get_current_user
from app.schemas.schemas import UserRegister, UserLogin, TokenResponse, GoogleAuthRequest, UserOut
from app.services.auth_service import register_user, authenticate_user, get_google_user_info, get_or_create_google_user
from app.core.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=TokenResponse)
def register(data: UserRegister, db: Session = Depends(get_db)):
    user = register_user(db, data)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/login", response_model=TokenResponse)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, data.email, data.password)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.post("/google", response_model=TokenResponse)
async def google_auth(data: GoogleAuthRequest, db: Session = Depends(get_db)):
    google_data = await get_google_user_info(data.code, data.redirect_uri)
    user = get_or_create_google_user(db, google_data)
    token = create_access_token({"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserOut)
def get_me(current_user=Depends(get_current_user)):
    return current_user


@router.get("/google/url")
def google_login_url():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    url = "https://accounts.google.com/o/oauth2/auth?" + "&".join(f"{k}={v}" for k, v in params.items())
    return {"url": url}
