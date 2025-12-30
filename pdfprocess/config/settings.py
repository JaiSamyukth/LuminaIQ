from pydantic_settings import BaseSettings
from typing import Optional, List

class Settings(BaseSettings):
    # Supabase Configuration
    SUPABASE_URL: str
    SUPABASE_SERVICE_KEY: str
    
    # Main API Webhook
    MAIN_API_WEBHOOK_URL: str = "http://localhost:8000/api/v1/webhook/document-ready"
    MAIN_API_WEBHOOK_SECRET: str = "webhook-secret-key"
    
    # Application Configuration
    ENVIRONMENT: str = "development"
    
    # CORS - Allow frontend and main API
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"]
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 10485760  # 10MB
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx", "txt", "html", "md"]
    
    # Chunking Configuration
    CHUNK_SIZE: int = 1000
    CHUNK_OVERLAP: int = 200

    # RAG / LLM Configuration
    TOGETHER_API_KEY: str = "tgp_v1_eIPDFX9sbZhpSYUhUxRHBbecUZ_71X0LBpvRI-Uy31Q"
    TOGETHER_BASE_URL: str = "https://api.together.xyz/v1"
    
    # Models
    # Using specific Serverless Endpoints for Together AI
    EMBEDDING_MODEL: str = "BAAI/bge-base-en-v1.5" # 768 dims, reliable
    CHAT_MODEL: str = "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" # Serverless & Fast
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
