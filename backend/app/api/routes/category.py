from fastapi import APIRouter, Depends, HTTPException
from app.models.category import CategoryDetectionRequest, CategoryResponse, ErrorResponse
from app.services.openai import OpenAIService
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/detect-category", 
    response_model=CategoryResponse,
    responses={
        400: {"model": ErrorResponse},
        500: {"model": ErrorResponse}
    })
async def detect_category(
    request: CategoryDetectionRequest,
    openai_service: OpenAIService = Depends(OpenAIService)
) -> CategoryResponse:
    try:
        logger.info(f"Detecting category for description: {request.description}")
        category, confidence = await openai_service.detect_category(request.description)
        return CategoryResponse(category=category, confidence=confidence)
    
    except Exception as e:
        logger.error(f"Error in detect_category: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )
