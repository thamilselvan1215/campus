from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
import os

class Settings(BaseSettings):
    # App Settings
    app_name: str = "AutoFix Campus API"
    environment: str = "development"
    debug: bool = True
    
    # Security
    secret_key: str = Field(default="super-secret-key-change-in-production")
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440 # 1 day
    
    # AI Credentials
    openai_api_key: str = ""
    gemini_api_key: str = ""
    use_mock_ai: bool = True
    hitl_confidence_threshold: float = 0.6
    
    # SLA 
    sla_minutes: int = 10
    
    # DB
    database_url: str = ""

    # SMTP (Email)
    smtp_server: str = ""
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    sender_email: str = "autofix-campus@example.com"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
