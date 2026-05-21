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

After SQLAlchemy models are added under `app/models/`:

1. Import models in `alembic/env.py` so metadata is registered.
2. Create a revision:

   ```powershell
   alembic revision --autogenerate -m "describe change"
   ```

3. Apply migrations:

   ```powershell
   alembic upgrade head
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
