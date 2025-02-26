from enum import Enum

class Category(str, Enum):
    # Catégories principales
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

    # Sous-catégories Santé
    MEDICAL = "MEDICAL"
    PHARMACY = "PHARMACY"
    INSURANCE = "INSURANCE"
    PILL = "PILL"
    SUPPLEMENTS = "SUPPLEMENTS"

    # Sous-catégories Shopping
    CLOTHING = "CLOTHING"
    ELECTRONICS = "ELECTRONICS"
    HOME = "HOME"
    BEAUTY = "BEAUTY"
    JEWELRY = "JEWELRY"

    # Autres sous-catégories
    GROCERIES = "GROCERIES"
    RESTAURANT = "RESTAURANT"
    BAR = "BAR"
    PUBLIC_TRANSPORT = "PUBLIC_TRANSPORT"
    TAXI = "TAXI"
    FUEL = "FUEL"
    RENT = "RENT"
    UTILITIES = "UTILITIES"
    INTERNET = "INTERNET"
    HOTEL = "HOTEL"
    ENTERTAINMENT = "ENTERTAINMENT"
    SPORT = "SPORT"
    BOOKS = "BOOKS"
    SUBSCRIPTIONS = "SUBSCRIPTIONS"
    SALARY = "SALARY"
    FREELANCE = "FREELANCE"
    REIMBURSEMENTS = "REIMBURSEMENTS"
    TRANSFER_ANTONIN = "TRANSFER_ANTONIN"
    TRANSFER_AMANDINE = "TRANSFER_AMANDINE"
    TOBACCO = "TOBACCO"
    CREDITS = "CREDITS"

CATEGORY_DESCRIPTIONS = {
    # Catégories principales
    Category.FOOD: "groceries, restaurants, bars",
    Category.TRANSPORT: "public transport, taxi, fuel",
    Category.HOUSING: "rent, utilities, internet, hotel",
    Category.LEISURE: "entertainment, sport, books",
    Category.HEALTH: "medical, pharmacy, insurance, pill, supplements",
    Category.SHOPPING: "clothing, electronics, home, beauty, jewelry",
    Category.SERVICES: "subscriptions, cleaning",
    Category.EDUCATION: "courses, books",
    Category.GIFTS: "presents, donations",
    Category.VETERINARY: "vet visits, pet food",
    Category.INCOME: "salary, freelance, reimbursements",
    Category.TRANSFERS: "transfer_antonin, transfer_amandine",
    Category.OTHER: "uncategorized",

    # Sous-catégories Santé
    Category.MEDICAL: "medical visits, consultations",
    Category.PHARMACY: "pharmacy purchases",
    Category.INSURANCE: "health insurance",
    Category.PILL: "medication, pills",
    Category.SUPPLEMENTS: "vitamins, supplements",

    # Sous-catégories Shopping
    Category.CLOTHING: "clothes, shoes, accessories",
    Category.ELECTRONICS: "gadgets, computers, phones",
    Category.HOME: "furniture, decoration",
    Category.BEAUTY: "cosmetics, personal care",
    Category.JEWELRY: "jewelry, watches",

    # Autres sous-catégories
    Category.GROCERIES: "supermarket, food shopping",
    Category.RESTAURANT: "dining out",
    Category.BAR: "drinks, nightlife",
    Category.PUBLIC_TRANSPORT: "bus, train, metro",
    Category.TAXI: "taxi, uber",
    Category.FUEL: "gasoline, diesel",
    Category.RENT: "housing rent",
    Category.UTILITIES: "electricity, water, gas",
    Category.INTERNET: "internet service, mobile data",
    Category.HOTEL: "hotel stays",
    Category.ENTERTAINMENT: "movies, concerts, events",
    Category.SPORT: "gym, sports activities",
    Category.BOOKS: "books, e-books",
    Category.SUBSCRIPTIONS: "recurring services",
    Category.SALARY: "regular income",
    Category.FREELANCE: "freelance income",
    Category.REIMBURSEMENTS: "expense reimbursements",
    Category.TRANSFER_ANTONIN: "transfers to/from Antonin",
    Category.TRANSFER_AMANDINE: "transfers to/from Amandine",
    Category.TOBACCO: "tobacco, cigarettes, vape",
    Category.CREDITS: "loans, credits, financing"
}

OPENAI_PROMPT = """Analyze the following transaction description and determine the most appropriate category. The category must be one of the following:
{categories}

Transaction description: "{description}"

Return only the category name without any explanation."""
