from enum import Enum

class TransactionType(str, Enum):
    INCOME = "income"
    EXPENSE = "expense"

class TransactionSource(str, Enum):
    SMS = "SMS"
    MANUAL = "Manual"
    TELEGRAM = "Telegram"

class TransactionState(str, Enum):
    PENDING = "Pending"
    APPROVED = "Approved"

class TransactionCategory(str, Enum):
    FOOD = "Food"
    DRINKS = "Drinks"
    RENT = "Rent"
    TRANSPORT = "Transport"
    TRAVEL = "Travel"
    SHOPPING = "Shopping"
    ENTERTAINMENT = "Entertainment"
    EDUCATION = "Education"
    HEALTH = "Health"
    OTHER = "Other"

class BudgetType(str, Enum):
    MONTHLY = "Monthly"
    GOAL = "Goal"

class UserArchetype(str, Enum):
    ALLOWANCE = "Allowance"
    JOBBER = "Jobber"
    TRAVELER = "Traveler"
    SAVER = "Saver"