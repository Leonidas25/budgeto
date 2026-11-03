from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from .enums import UserArchetype

class UserBase(SQLModel):
    username: str = Field(unique=True, index=True, min_length=3, max_length=50)
    email: str = Field(unique=True, index=True)
    full_name: str = Field(max_length=100)
    archetype: UserArchetype = Field(default=UserArchetype.ALLOWANCE)
    telegram_id: Optional[str] = Field(default=None, unique=True)
    is_active: bool = Field(default=True)

class User(UserBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    hashed_password: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    transactions: List["Transaction"] = Relationship(back_populates="user")
    budgets: List["Budget"] = Relationship(back_populates="user")
    gamification: Optional["UserGamification"] = Relationship(back_populates="user")

class UserCreate(UserBase):
    password: str = Field(min_length=8)

class UserRead(UserBase):
    id: int
    created_at: datetime

class UserUpdate(SQLModel):
    full_name: Optional[str] = None
    archetype: Optional[UserArchetype] = None
    telegram_id: Optional[str] = None
    is_active: Optional[bool] = None