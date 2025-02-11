from typing import Optional, Tuple
import logging
import os
import sys
from dotenv import load_dotenv

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../"))
if project_root not in sys.path:
    sys.path.append(project_root)

from autogen_agentchat.teams import RoundRobinGroupChat
from autogen_agentchat.agents import AssistantAgent
from autogen_ext.models.openai import AzureOpenAIChatCompletionClient
from autogen_core.tools import FunctionTool
from langchain_community.tools.tavily_search import TavilySearchResults
from app.core.config import get_settings
from app.core.constants import Category, CATEGORY_DESCRIPTIONS

logger = logging.getLogger(__name__)

class CategoryReportGenerator:
    def __init__(self):
        load_dotenv()
        settings = get_settings()
        
        # Configuration des clés API
        self.tavily_api_key = os.getenv("TAVILY_API_KEY")
        self.openai_api_key = settings.AZURE_OPENAI_API_KEY
        
        # Configuration du client Azure OpenAI
        self.gpt_4o_azure = AzureOpenAIChatCompletionClient(
            azure_deployment=settings.AZURE_OPENAI_DEPLOYMENT,
            model="gpt-4o",
            api_version=settings.AZURE_OPENAI_API_VERSION,
            azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
            api_key=self.openai_api_key,
        )
        
        self._setup_tools()
        self._setup_agents()
        self.team = RoundRobinGroupChat(
            [self.search_agent, self.confirm_category_agent, self.format_agent], 
            max_turns=6
        )

    def _setup_tools(self):
        """Définition des outils comme méthodes de la classe."""
        self.tavily_search_tool = FunctionTool(
            self.tavily_search, 
            description="Search Tavily for information, focus on the first result, then https://www.societe.com/, then https://annuaire-entreprises.data.gouv.fr/ to find the main activity of the company linked to the expense, returns the activity found."
        )
        self.get_available_categories_tool = FunctionTool(
            self.get_available_categories,
            description="Get available transaction categories"
        )

    def _setup_agents(self):
        """Configuration des agents avec le client modèle et les outils."""
        self.search_agent = AssistantAgent(
            name="Tavily_Search_Agent",
            model_client=self.gpt_4o_azure,
            tools=[self.tavily_search_tool],
            description="Search Tavily to search the web for the user query. Should focus on the first result, then https://www.societe.com/, then https://annuaire-entreprises.data.gouv.fr/ to find the main activity of the company linked to the expense shared by the user.",
            system_message="""You are a research assistant specialized in browsing internet. 
            You're tasked to find the main activity of the company linked to the expense shared by the user. 
            You focus on the first result, then https://www.societe.com/, then https://annuaire-entreprises.data.gouv.fr/.
            
            Always explain what you found in your research before passing to the next agent.
            Example: "Based on my research, this appears to be a pub/restaurant in Bordeaux..."
            """
        )

        self.confirm_category_agent = AssistantAgent(
            name="Category_Agent",
            model_client=self.gpt_4o_azure,
            tools=[self.get_available_categories_tool],
            description="Confirm the category of the expense based on the research results.",
            system_message="""You are an assistant that takes input from a websearch related to a specific expense.
            Your job is to:
            1. Review the research results from the previous agent
            2. Get the list of available categories using your tool
            3. Select the most appropriate category
            4. Explain your choice before passing to the next agent
            
            Example: "Based on the research showing this is a {business type}, I recommend the {category} category because..."
            """
        )

        self.format_agent = AssistantAgent(
            name="Format_Agent",
            model_client=self.gpt_4o_azure,
            description="Format the final category response as JSON",
            system_message="""You are a formatting agent. Your job is to:
            1. Review the category suggestion from the previous agent
            2. Format it as JSON with a single field 'category'
            3. Ensure the category is one of the valid categories
            4. Output only valid JSON in this format: {"category": "CATEGORY_NAME"}
            
            Do not add any other text or explanation.
            """
        )

    def tavily_search(self, query: str, num_results: int = 3) -> list:
        """Recherche en ligne via Tavily et retourne les résultats enrichis."""
        search_tool = TavilySearchResults(max_results=num_results, tavily_api_key=self.tavily_api_key, search_depth="advanced", include_answer=True, include_raw_content=True,)
        return search_tool.run({"query": query})

    def get_available_categories(self) -> dict:
        """Récupération des catégories disponibles"""
        return {
            "categories": [category.value for category in Category],
            "descriptions": CATEGORY_DESCRIPTIONS
        }

    async def detect_category(self, description: str) -> Tuple[Category, float, list]:
        """Détection de la catégorie pour une description donnée"""
        try:
            logger.info(f"Analyzing category for: {description}")
            result = await self.team.run(task=description)
            
            # Récupérer les messages de la conversation
            conversation = []
            if hasattr(result, 'messages'):
                for msg in result.messages:
                    if hasattr(msg, 'content') and hasattr(msg, 'source'):
                        conversation.append({
                            'agent': msg.source,
                            'content': str(msg.content)
                        })
            
            # Extract category from the last format agent message
            last_format_message = None
            if conversation:
                # Parcourir la conversation à l'envers pour trouver le dernier message du Format_Agent
                for msg in reversed(conversation):
                    if msg['agent'] == 'Format_Agent':
                        last_format_message = msg['content']
                        break
            
            if last_format_message:
                try:
                    # Parse le dernier message JSON du Format_Agent
                    import json
                    result_json = json.loads(last_format_message)
                    category_str = result_json["category"].upper().strip()
                    
                    # Vérifier si la catégorie existe dans l'enum
                    if category_str in [cat.value for cat in Category]:
                        category = Category(category_str)
                        confidence = 0.9
                        return category, confidence, conversation
                except (json.JSONDecodeError, KeyError) as e:
                    logger.error(f"Error parsing format agent response: {e}")
            
            # Si on arrive ici, c'est qu'il y a eu un problème
            logger.error("No valid category found in format agent response")
            return Category.OTHER, 0.5, conversation
                
        except Exception as e:
            logger.error(f"Error detecting category: {str(e)}")
            return Category.OTHER, 0.5, []
