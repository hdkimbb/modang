"""Production seed runner — run once after deploy on an empty database.

Railway (backend root directory):
  alembic upgrade head
  python scripts/seed_prod.py

Warning: clears and re-inserts all seed data (same as python -m app.seed).
"""

from __future__ import annotations

import sys
from pathlib import Path

# Allow `python scripts/seed_prod.py` from backend/
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.seed import main as run_seed


def main() -> None:
    print("Running production seed (full reset + insert)...")
    run_seed()
    print("Done.")


if __name__ == "__main__":
    main()
