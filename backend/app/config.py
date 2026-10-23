"""
app/config.py — loads and validates all environment variables using pydantic-settings.
Settings are read once at startup; all modules import from this module.
"""
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl
from typing import List
import os


class Settings(BaseSettings):
    # MongoDB
    MONGODB_URL: str
    MONGODB_DB_NAME: str = "smart_agriculture"

    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    # CORS — comma-separated list of allowed origins
    CORS_ORIGINS: str = "http://localhost:5173"

    # Open-Meteo
    OPEN_METEO_BASE_URL: str = "https://api.open-meteo.com/v1"

    # Environment
    ENVIRONMENT: str = "development"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
