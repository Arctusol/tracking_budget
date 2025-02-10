from openai import AzureOpenAI
from typing import Optional
import logging
from app.core.config import get_settings
from app.core.constants import Category, CATEGORY_DESCRIPTIONS, OPENAI_PROMPT

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        settings = get_settings()
        self.client = AzureOpenAI(
            api_key=settings.AZURE_OPENAI_API_KEY,
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
        )
        self.deployment = settings.AZURE_OPENAI_DEPLOYMENT

    def _format_categories(self) -> str:
        return "\n".join([
            f"- {cat.value} ({CATEGORY_DESCRIPTIONS[cat]})"
            for cat in Category
        ])

    async def detect_category(self, description: str) -> tuple[Category, Optional[float]]:
        try:
            prompt = OPENAI_PROMPT.format(
                categories=self._format_categories(),
                description=description
            )
            
            logger.info(f"Sending request to OpenAI for description: {description}")
            
            completion = await self.client.chat.completions.acreate(
                model=self.deployment,
                messages=[{"role": "user", "content": prompt}],
                temperature=0,
                max_tokens=10,
            )

            category_str = completion.choices[0].message.content.strip()
            
            try:
                category = Category(category_str)
                confidence = completion.choices[0].finish_reason == "stop" and 1.0 or 0.8
                return category, confidence
            except ValueError:
                logger.error(f"Invalid category received: {category_str}")
                return Category.OTHER, 0.5

        except Exception as e:
            logger.error(f"Error detecting category: {str(e)}")
            raise
