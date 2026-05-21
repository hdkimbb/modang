import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()

_DEFAULT_CORS = "http://localhost:3000,http://127.0.0.1:3000"


def normalize_database_url(url: str) -> str:
    """Railway/Heroku often provide postgres://; SQLAlchemy 2 needs postgresql://."""
    if url.startswith("postgres://"):
        return "postgresql://" + url[len("postgres://") :]
    return url


def parse_cors_origins() -> list[str]:
    origins: list[str] = []
    cors_raw = os.getenv("CORS_ORIGINS", _DEFAULT_CORS)
    if cors_raw:
        origins.extend(o.strip() for o in cors_raw.split(",") if o.strip())
    allowed_raw = os.getenv("ALLOWED_ORIGINS", "")
    if allowed_raw:
        origins.extend(o.strip() for o in allowed_raw.split(",") if o.strip())
    seen: set[str] = set()
    unique: list[str] = []
    for origin in origins:
        if origin not in seen:
            seen.add(origin)
            unique.append(origin)
    return unique


@lru_cache
def get_settings() -> "Settings":
    return Settings()


class Settings:
    def __init__(self) -> None:
        raw_db = os.getenv("DATABASE_URL", "sqlite:///./modang.db")
        self.database_url = normalize_database_url(raw_db)
        self.environment: str = os.getenv("ENVIRONMENT", "development")
        self.kakao_rest_api_key: str = os.getenv("KAKAO_REST_API_KEY", "")
        self.cors_origins: list[str] = parse_cors_origins()

    @property
    def kakao_enabled(self) -> bool:
        key = self.kakao_rest_api_key.strip()
        return bool(key) and "여기에" not in key
