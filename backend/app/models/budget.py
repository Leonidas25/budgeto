from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import date, datetime
from decimal import Decimal
from .enums import BudgetType

class BudgetBase(SQLModel):
    type: BudgetType = Field(description="Monthly budget or savings goal")
    name: str = Field(max_length=100, description="Budget or goal name")
    target_amount: Decimal = Field(decimal_places=2, ge=0.01, description="Target amount in EUR")
    deadline: Optional[date] = Field(default=None, description="Deadline for goals")
    is_active: bool = Field(default=True)

class Budget(BudgetBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    current_amount: Decimal = Field(default=0, decimal_places=2, description="Current progress")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    user: "User" = Relationship(back_populates="budgets")

class BudgetCreate(BudgetBase):
    pass

class BudgetRead(BudgetBase):
    id: int
    user_id: int
    current_amount: Decimal
    created_at: datetime
    progress_percentage: Optional[float] = None

class BudgetUpdate(SQLModel):
    name: Optional[str] = None
    target_amount: Optional[Decimal] = None
    deadline: Optional[date] = None
    is_active: Optional[bool] = None

class BudgetProgress(SQLModel):
    budget_id: int
    amount_spent: Decimal
    amount_remaining: Decimal
    progress_percentage: float
    is_over_budget: bool
    days_remaining: Optional[int] = None