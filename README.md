# SurveyMarket — Full-Stack Survey Marketplace Platform

A production-ready SaaS platform where users complete surveys to earn money, companies post surveys and get insights, and admins manage everything.

---

## Architecture

```
surveymarketplace/
├── backend/          # FastAPI (Python)
│   ├── app/
│   │   ├── api/routes/   # auth, user, survey, company, admin
│   │   ├── core/         # security, config
│   │   ├── db/           # SQLAlchemy setup
│   │   ├── models/       # User, Company, Survey, Wallet, Payment
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── tasks/        # Celery background jobs
│   └── requirements.txt
│
├── frontend/         # Next.js 14 (TypeScript)
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # Landing page
│       │   ├── auth/login            # Login page
│       │   ├── auth/register         # Register page
│       │   ├── auth/callback         # Google OAuth callback
│       │   ├── dashboard/            # User dashboard
│       │   ├── dashboard/surveys/    # Browse & take surveys
│       │   ├── dashboard/wallet/     # Earnings & withdrawals
│       │   ├── dashboard/profile/    # Profile settings
│       │   ├── dashboard/company/    # Company dashboard
│       │   ├── dashboard/company/create    # Survey builder
│       │   ├── dashboard/company/surveys   # Survey management
│       │   ├── dashboard/company/wallet    # Deposit funds
│       │   └── admin/               # Admin panel
│       ├── components/
│       │   ├── layout/DashboardLayout.tsx
│       │   ├── dashboard/StatCard.tsx
│       │   └── survey/SurveyCard.tsx
│       └── lib/
│           ├── api.ts    # Axios client + all API calls
│           ├── store.ts  # Zustand auth store
│           └── utils.ts  # Helpers + Razorpay loader
│
└── docker-compose.yml
```

---

## Quick Start

### Option A: Docker (recommended)

```bash
# 1. Clone and configure
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local

# 2. Fill in your keys (see Keys Required section below)
nano backend/.env
nano frontend/.env.local

# 3. Launch everything
docker-compose up -d

# 4. Visit
# Frontend: http://localhost:3000
# API docs:  http://localhost:8000/docs
```

### Option B: Manual

```bash
# --- Backend ---
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # fill in your values

# Create PostgreSQL database
createdb surveymarket

# Start API (auto-creates tables on first run)
uvicorn app.main:app --reload --port 8000

# Start Celery worker (separate terminal)
celery -A app.tasks.celery_tasks.celery_app worker --loglevel=info

# --- Frontend ---
cd frontend
npm install
cp .env.local.example .env.local  # fill in your values
npm run dev
```

---

## Keys Required

### PostgreSQL
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/surveymarket
```

### Redis
```
REDIS_URL=redis://localhost:6379/0
```

### JWT
```
SECRET_KEY=generate-with: openssl rand -hex 32
```

### Google OAuth
1. Go to https://console.cloud.google.com
2. Create OAuth 2.0 credentials
3. Add authorized redirect URIs:
   - `http://localhost:8000/auth/google/callback`
   - `http://localhost:3000/auth/callback`
```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

### Razorpay
1. Sign up at https://dashboard.razorpay.com
2. Get Key ID and Key Secret from Settings → API Keys
```
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=xxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxx
```

---

## Creating an Admin User

After starting, create an admin manually in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@yourdomain.com';
```

Or via psql:
```bash
psql -U postgres -d surveymarket -c "UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';"
```

---

## API Documentation

Full Swagger UI available at: `http://localhost:8000/docs`
ReDoc available at: `http://localhost:8000/redoc`

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user/company |
| POST | /auth/login | Email/password login |
| POST | /auth/google | Google OAuth login |
| GET | /survey/available | List surveys for users |
| POST | /survey/{id}/submit | Submit survey answers |
| POST | /survey/company/create | Create a new survey |
| POST | /company/payment/create-order | Create Razorpay order |
| POST | /company/payment/verify | Verify payment + credit wallet |
| POST | /user/wallet/withdraw | Request withdrawal |
| POST | /admin/surveys/{id}/action | Approve/reject survey |
| POST | /admin/withdrawals/{id}/action | Approve/reject withdrawal |

---

## Platform Economics

- Companies deposit money via Razorpay
- When creating a survey, budget is reserved: `reward × responses + 10% platform fee`
- Users earn the exact reward per completed survey (credited instantly)
- Platform earns 10% commission on all survey budgets
- Unused budget from rejected surveys is fully refunded to company

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Python 3.11 |
| Database | PostgreSQL 15 + SQLAlchemy 2.0 |
| Cache | Redis 7 |
| Queue | Celery 5 |
| Auth | JWT (jose) + Google OAuth (httpx) |
| Payments | Razorpay |
| State | Zustand (frontend) |
| Forms | React Hook Form + Zod |
| Charts | Recharts |

---

## Security Features

- JWT authentication on all protected routes
- Role-based access control (user / company / admin)
- Razorpay HMAC signature verification
- Duplicate survey submission prevention (DB constraint)
- Rate limiting via SlowAPI
- Input validation via Pydantic v2
- SQL injection prevention via SQLAlchemy ORM
- Fraud detection via Celery (IP-based rate limiting)

---

## Background Jobs (Celery)

| Task | Schedule | Description |
|------|----------|-------------|
| check_expired_surveys | Hourly | Marks expired surveys completed, refunds unused budget |
| generate_daily_analytics | Daily | Analytics aggregation |
| fraud_detection | On submit | Flags suspicious IP activity |
