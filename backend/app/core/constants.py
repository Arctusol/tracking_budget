from enum import Enum

class Category(str, Enum):
    FOOD = "FOOD"
    TRANSPORT = "TRANSPORT"
    HOUSING = "HOUSING"
    LEISURE = "LEISURE"
    HEALTH = "HEALTH"
    SHOPPING = "SHOPPING"
    SERVICES = "SERVICES"
    EDUCATION = "EDUCATION"
    GIFTS = "GIFTS"
    VETERINARY = "VETERINARY"
    INCOME = "INCOME"
    TRANSFERS = "TRANSFERS"
    OTHER = "OTHER"

CATEGORY_DESCRIPTIONS = {
    Category.FOOD: "groceries, restaurants, bars",
    Category.TRANSPORT: "public transport, taxi, fuel",
    Category.HOUSING: "rent, utilities, internet",
    Category.LEISURE: "entertainment, sport, books",
    Category.HEALTH: "medical, pharmacy, insurance",
    Category.SHOPPING: "clothing, electronics, home",
    Category.SERVICES: "subscriptions, cleaning",
    Category.EDUCATION: "courses, books",
    Category.GIFTS: "presents, donations",
    Category.VETERINARY: "vet visits, pet food",
    Category.INCOME: "salary, refunds",
    Category.TRANSFERS: "between accounts",
    Category.OTHER: "uncategorized"
}

OPENAI_PROMPT = """Analyze the following transaction description and determine the most appropriate category. The category must be one of the following:
{categories}

Transaction description: "{description}"

Return only the category name without any explanation."""
