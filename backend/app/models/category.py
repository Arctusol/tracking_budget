from pydantic import BaseModel, Field
from typing import Optional, List
from app.core.constants import Category

class CategoryDetectionRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)

class AgentMessage(BaseModel):
    agent: str
    content: str

class CategoryResponse(BaseModel):
    category: Category
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    conversation: List[AgentMessage] = Field(default_factory=list)

class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None
