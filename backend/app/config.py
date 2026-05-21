import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


@lru_cache
def get_settings() -> "Settings":
    return Settings()


class Settings:
    def __init__(self) -> None:
        self.database_url: str = os.getenv(
            "DATABASE_URL",
            "sqlite:///./modang.db",
        )
        self.environment: str = os.getenv("ENVIRONMENT", "development")
        self.kakao_rest_api_key: str = os.getenv("KAKAO_REST_API_KEY", "")
        cors_raw = os.getenv(
            "CORS_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000",
        )
        self.cors_origins: list[str] = [
            origin.strip() for origin in cors_raw.split(",") if origin.strip()
        ]

    @property
    def kakao_enabled(self) -> bool:
        key = self.kakao_rest_api_key.strip()
        return bool(key) and "여기에" not in key
