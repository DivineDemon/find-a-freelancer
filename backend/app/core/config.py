from typing import Sequence

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET: str
    DATABASE_URL: str
    VERSION: str = "1.0.0"
    LOG_LEVEL: str = "INFO"
    JWT_ALGORITHM: str = "HS256"
    CORS_ORIGINS: Sequence[str] = ["*"]
    JWT_EXPIRATION_MINUTES: int = 60 * 24
    APP_NAME: str = "Find a Freelancer BE"

    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""
    PAYPAL_MODE: str = "sandbox"
    PAYPAL_WEBHOOK_ID: str = ""

    PLATFORM_FEE_AMOUNT: float = 50.00
    PLATFORM_FEE_CURRENCY: str = "USD"

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings() # type: ignore