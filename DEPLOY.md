# Deploy SurveyMarket (full stack)

Vercel only hosts the Next.js frontend. This app also needs **PostgreSQL**, **Redis**, **FastAPI**, and **Celery** — deploy them together using one of the options below.

---

## What you are deploying

| Component | Role |
|-----------|------|
| **frontend** | Next.js (port 3000) |
| **backend** | FastAPI API (port 8000) |
| **postgres** | Database |
| **redis** | Cache + Celery broker |
| **celery_worker** | Background jobs (withdrawals, etc.) |
| **celery_beat** | Scheduled tasks |

Your repo already has Dockerfiles and `docker-compose.yml` for all of this.

---

## Option A — Single VPS + Docker (simplest “everything on one server”)

Best if you want one machine, one bill, and full control. Works on **DigitalOcean**, **Hetzner**, **AWS Lightsail**, or any Linux VM with Docker installed.

### 1. Create a server

- Ubuntu 22.04+, at least **2 GB RAM** (4 GB recommended with Celery).
- Open firewall ports **80**, **443**, and optionally **22** (SSH only).

### 2. Install Docker on the server

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# log out and back in
```

### 3. Clone the repo on the server

```bash
git clone https://github.com/YOUR_USER/surveymarketplace.git
cd surveymarketplace
```

### 4. Configure environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
nano backend/.env
nano frontend/.env.local
```

**backend/.env** (production example):

```env
DATABASE_URL=postgresql://postgres:STRONG_PASSWORD@postgres:5432/surveymarket
REDIS_URL=redis://redis:6379/0
CELERY_BROKER_URL=redis://redis:6379/1
CELERY_RESULT_BACKEND=redis://redis:6379/2
SECRET_KEY=<run: openssl rand -hex 32>
FRONTEND_URL=https://yourdomain.com
GOOGLE_REDIRECT_URI=https://api.yourdomain.com/auth/google/callback
# ... Razorpay, Google OAuth keys
```

**frontend/.env.local** (used at Docker build time):

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxx
NEXT_PUBLIC_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
```

Also set `POSTGRES_PASSWORD` in `docker-compose.yml` (or use a `.env` file at repo root) to match `DATABASE_URL`.

### 5. Build and run

```bash
export NEXT_PUBLIC_API_URL=https://api.yourdomain.com
export NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://yourdomain.com/auth/callback
# export other NEXT_PUBLIC_* as needed

docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
docker compose exec backend python seed.py
```

### 6. Put HTTPS in front (recommended)

Use **Caddy** or **nginx** on the same VPS:

- `yourdomain.com` → `localhost:3000` (frontend)
- `api.yourdomain.com` → `localhost:8000` (backend)

Example Caddyfile:

```
yourdomain.com {
  reverse_proxy localhost:3000
}
api.yourdomain.com {
  reverse_proxy localhost:8000
}
```

Caddy obtains TLS certificates automatically.

### 7. Update third-party redirect URLs

In **Google Cloud Console** → OAuth client, add:

- `https://api.yourdomain.com/auth/google/callback`
- `https://yourdomain.com/auth/callback`

In **Razorpay**, use live keys and your production domain.

**Cost:** roughly **$6–12/month** for a small VPS.

---

## Option B — Railway (managed, no server admin)

Good if you prefer a dashboard and managed Postgres/Redis. Deploy from GitHub.

### 1. Push code to GitHub

### 2. Create a Railway project

1. [railway.app](https://railway.app) → New Project → Deploy from GitHub repo.
2. Add plugins: **PostgreSQL**, **Redis**.

### 3. Create services (5 total)

| Service | Root directory | Start command / Dockerfile |
|---------|----------------|----------------------------|
| **backend** | `/backend` | Dockerfile default (`uvicorn`) |
| **celery-worker** | `/backend` | `celery -A app.tasks.celery_tasks.celery_app worker --loglevel=info` |
| **celery-beat** | `/backend` | `celery -A app.tasks.celery_tasks.celery_app beat --loglevel=info` |
| **frontend** | `/frontend` | Dockerfile (build with env vars below) |

Reference Postgres/Redis URLs from Railway variables into each backend service.

### 4. Environment variables (backend)

Use Railway’s `${{Postgres.DATABASE_URL}}` and `${{Redis.REDIS_URL}}` style references where available.

```
DATABASE_URL=...
REDIS_URL=...
CELERY_BROKER_URL=...   # same Redis, db /1
CELERY_RESULT_BACKEND=... # db /2
SECRET_KEY=...
FRONTEND_URL=https://your-frontend.up.railway.app
GOOGLE_REDIRECT_URI=https://your-backend.up.railway.app/auth/google/callback
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
```

### 5. Environment variables (frontend build)

Set on the **frontend** service before deploy:

```
NEXT_PUBLIC_API_URL=https://your-backend.up.railway.app
NEXT_PUBLIC_GOOGLE_REDIRECT_URI=https://your-frontend.up.railway.app/auth/callback
NEXT_PUBLIC_RAZORPAY_KEY_ID=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

### 6. Seed and custom domain

```bash
railway run python seed.py   # from backend service
```

Add custom domains in Railway for frontend + API, then update Google/Razorpay redirects.

**Cost:** roughly **$20–40/month** depending on usage (Postgres + Redis + multiple services).

---

## Option C — Render

Similar to Railway: separate **Web Services** for backend, frontend, worker, beat, plus **PostgreSQL** and **Redis** from the Render dashboard. Point env vars the same way as Option B.

---

## What not to use alone

| Platform | Limitation |
|----------|------------|
| **Vercel only** | No Postgres/Redis/Celery on your project; API must live elsewhere |
| **Netlify only** | Same as Vercel for this stack |

You *can* use Vercel for frontend + Railway for backend, but that splits hosting. **Option A or B keeps the whole system under one deployment model.**

---

## Production checklist

- [ ] Generate strong `SECRET_KEY`: `openssl rand -hex 32`
- [ ] Change Postgres password (not `password`)
- [ ] Set `FRONTEND_URL` to your real frontend URL (CORS)
- [ ] Set `NEXT_PUBLIC_API_URL` to your real API URL
- [ ] Run `python seed.py` once (or create admin manually)
- [ ] Google OAuth redirect URIs updated for production
- [ ] Razorpay live keys (if accepting real payments)
- [ ] Celery worker + beat running (withdrawals/schedules need them)

---

## Verify deployment

```bash
curl https://api.yourdomain.com/health
# {"status":"healthy","service":"VeLOQ API"}

open https://yourdomain.com
open https://api.yourdomain.com/docs
```

Demo logins (after seed): `admin@veloq.com` / `Admin@12345`, etc. — change passwords in production.
