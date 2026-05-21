# Modang Backend

FastAPI backend for the Modang (모당) neighborhood awards system.

## Prerequisites

- Python 3.11+ recommended

## Setup

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
```

Edit `.env` if you need a different database URL or CORS origins.

## Run (development)

From the `backend/` directory with the virtual environment activated:

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

- API root: http://localhost:8000/
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Tests

```powershell
pytest
```

## Database migrations (Alembic)

From `backend/` with venv activated:

```powershell
alembic upgrade head
```

Initial migration creates `users`, `places`, `place_signals` in `modang.db`.

## Seed data

```powershell
python -m app.seed
```

Re-runs delete existing rows and re-insert (dev convenience).

Example output:

```
Seeded 5 users, 10 places, 67 signals
Top places by signals: plc_001 (47), plc_002 (12), plc_003 (8)
```

## Project layout

```
app/
  main.py       # FastAPI entry + CORS
  config.py     # Environment settings
  db.py         # SQLAlchemy engine & session
  models/       # ORM models
  routers/      # API routes (/api/v1 later)
  schemas/      # Pydantic schemas
  services/     # Business logic (e.g. id.py)
alembic/        # DB migrations
tests/          # Pytest
```
