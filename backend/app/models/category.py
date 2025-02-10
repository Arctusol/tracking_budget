from pydantic import BaseModel, Field
from typing import Optional
from app.core.constants import Category

class CategoryDetectionRequest(BaseModel):
    description: str = Field(..., min_length=1, max_length=500)

class CategoryResponse(BaseModel):
    category: Category
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)

class ErrorResponse(BaseModel):
    error: str
    details: Optional[str] = None
