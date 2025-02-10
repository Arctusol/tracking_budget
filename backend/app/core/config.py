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
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173"]  # Vite default port
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings() -> Settings:
    return Settings()
