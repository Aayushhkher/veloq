from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager

from app.core.config import settings
from app.db.database import init_db
from app.api.routes import auth, user, survey, company, admin
from app.api.routes import admin_companies
from app.api.routes import compliance


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="VeLOQ API",
    description="SaaS survey marketplace platform - earn and collect insights",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth.router)
app.include_router(user.router)
app.include_router(survey.router)
app.include_router(company.router)
app.include_router(admin.router)
app.include_router(admin_companies.router)
app.include_router(compliance.router)


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "VeLOQ API"}


@app.get("/")
def root():
    return {"message": "Welcome to VeLOQ API", "docs": "/docs"}
