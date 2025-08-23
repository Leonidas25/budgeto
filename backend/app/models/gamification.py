from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import date, datetime

class UserGamificationBase(SQLModel):
    xp: int = Field(default=0, ge=0)
    level: int = Field(default=1, ge=1)
    streak_count: int = Field(default=0, ge=0)
    last_activity: Optional[date] = Field(default=None)

class UserGamification(UserGamificationBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id", unique=True)
    total_transactions_approved: int = Field(default=0)
    total_budgets_met: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    user: "User" = Relationship(back_populates="gamification")

class UserGamificationRead(UserGamificationBase):
    id: int
    user_id: int
    total_transactions_approved: int
    total_budgets_met: int
    created_at: datetime
    xp_to_next_level: int
    level_progress_percentage: float

class XPReward(SQLModel):
    action: str
    xp_amount: int
    description: str

class WeeklyInsight(SQLModel):
    id: Optional[int] = None
    user_id: int
    week_start: date
    message: str
    category: str  # "spending", "saving", "achievement", "tip"
    is_funny: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# XP Configuration
XP_REWARDS = {
    'transaction_approved': 10,
    'daily_login': 5,
    'week_streak': 25,
    'budget_goal_met': 50,
    'month_tracking_complete': 100,
    'first_telegram_use': 15,
    'category_correct_guess': 5
}

LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000]

def calculate_level(xp: int) -> tuple[int, int, float]:
    """
    Calculate user level, XP to next level, and progress percentage
    Returns: (level, xp_to_next_level, progress_percentage)
    """
    for level, threshold in enumerate(LEVEL_THRESHOLDS[1:], 1):
        if xp < threshold:
            prev_threshold = LEVEL_THRESHOLDS[level - 1]
            xp_to_next = threshold - xp
            progress = ((xp - prev_threshold) / (threshold - prev_threshold)) * 100
            return level - 1, xp_to_next, progress
    
    # Max level reached
    return len(LEVEL_THRESHOLDS) - 1, 0, 100.0