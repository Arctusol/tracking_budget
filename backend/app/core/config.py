from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    # Azure OpenAI
    AZURE_OPENAI_ENDPOINT: str
    AZURE_OPENAI_API_KEY: str
    AZURE_OPENAI_DEPLOYMENT: str = "gpt-4"
    AZURE_OPENAI_API_VERSION: str = "2024-02-15-preview"
    
    # Tavily API
    TAVILY_API_KEY: str
    
    # FastAPI
    API_HOST: str = "localhost"
    API_PORT: int = 8000
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "https://tracking-budget-cti1yf10f-arctusols-projects.vercel.app",
        "https://tracking-budget-ten.vercel.app"
    ]
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-here"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Additional APIs
    LANGSMITH_API_KEY: str | None = None
    LANGSMITH_TRACING: bool = False
    GITHUB_TOKEN: str | None = None
    GOOGLE_API_KEY: str | None = None
    ANTHROPIC_API_KEY: str | None = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignorer les variables supplémentaires non définies

@lru_cache()
def get_settings() -> Settings:
    return Settings()
