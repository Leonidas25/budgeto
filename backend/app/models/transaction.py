from sqlmodel import SQLModel, Field, Relationship
from typing import Optional
from datetime import datetime
from decimal import Decimal
from .enums import TransactionType, TransactionSource, TransactionState, TransactionCategory

class TransactionBase(SQLModel):
    amount: Decimal = Field(decimal_places=2, ge=0.01, description="Transaction amount in EUR")
    type: TransactionType = Field(description="Income or Expense")
    category: TransactionCategory = Field(default=TransactionCategory.OTHER)
    description: Optional[str] = Field(default=None, max_length=255)
    source: TransactionSource = Field(default=TransactionSource.MANUAL)
    state: TransactionState = Field(default=TransactionState.PENDING)
    suggested_category: Optional[TransactionCategory] = Field(default=None)
    original_sms: Optional[str] = Field(default=None, max_length=500)

class Transaction(TransactionBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    approved_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    user: "User" = Relationship(back_populates="transactions")

class TransactionCreate(TransactionBase):
    pass

class TransactionRead(TransactionBase):
    id: int
    user_id: int
    timestamp: datetime
    approved_at: Optional[datetime]

class TransactionUpdate(SQLModel):
    amount: Optional[Decimal] = None
    category: Optional[TransactionCategory] = None
    description: Optional[str] = None
    state: Optional[TransactionState] = None

class TransactionApprove(SQLModel):
    category: Optional[TransactionCategory] = None
    description: Optional[str] = None