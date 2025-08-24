from sqlmodel import SQLModel, Field, Relationship, Column, JSON
from typing import Optional, List, Dict, Any
from datetime import date, datetime
from enum import Enum

class AchievementType(str, Enum):
    TRANSACTION_COUNT = "transaction_count"
    STREAK = "streak"
    LEVEL = "level"
    SPENDING = "spending"
    SPECIAL = "special"

class NotificationType(str, Enum):
    ACHIEVEMENT_UNLOCKED = "achievement_unlocked"
    LEVEL_UP = "level_up"
    STREAK_MILESTONE = "streak_milestone"
    XP_EARNED = "xp_earned"

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

class Achievement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    key: str = Field(unique=True, index=True)  # Unique identifier like "transaction_warrior"
    title: str
    description: str
    icon: str  # Emoji or icon identifier
    type: AchievementType
    requirement_value: int  # The value needed to unlock (e.g., 10 for "10 transactions")
    xp_reward: int = Field(default=0)
    is_active: bool = Field(default=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserAchievement(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    achievement_id: int = Field(foreign_key="achievement.id")
    unlocked_at: datetime = Field(default_factory=datetime.utcnow)
    notified: bool = Field(default=False)  # Whether user has been notified
    
    # Relationships
    achievement: Achievement = Relationship()

class Notification(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="user.id")
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))  # Additional data like achievement_id, xp_amount, etc.
    read: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    expires_at: Optional[datetime] = Field(default=None)

class AchievementRead(SQLModel):
    id: int
    key: str
    title: str
    description: str
    icon: str
    type: AchievementType
    requirement_value: int
    xp_reward: int
    unlocked: bool = False
    unlocked_at: Optional[datetime] = None
    progress: float = 0.0  # 0.0 to 1.0
    current_value: int = 0

class NotificationRead(SQLModel):
    id: int
    type: NotificationType
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None
    read: bool
    created_at: datetime
    expires_at: Optional[datetime] = None

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

# Achievement Definitions
ACHIEVEMENTS = [
    {
        "key": "first_transaction",
        "title": "First Steps",
        "description": "Add your first transaction",
        "icon": "🌟",
        "type": AchievementType.TRANSACTION_COUNT,
        "requirement_value": 1,
        "xp_reward": 20
    },
    {
        "key": "transaction_warrior",
        "title": "Transaction Warrior",
        "description": "Add 10 transactions",
        "icon": "⚡",
        "type": AchievementType.TRANSACTION_COUNT,
        "requirement_value": 10,
        "xp_reward": 50
    },
    {
        "key": "transaction_master",
        "title": "Transaction Master",
        "description": "Add 50 transactions",
        "icon": "👑",
        "type": AchievementType.TRANSACTION_COUNT,
        "requirement_value": 50,
        "xp_reward": 100
    },
    {
        "key": "transaction_legend",
        "title": "Transaction Legend",
        "description": "Add 100 transactions",
        "icon": "💎",
        "type": AchievementType.TRANSACTION_COUNT,
        "requirement_value": 100,
        "xp_reward": 200
    },
    {
        "key": "streak_starter",
        "title": "Streak Starter",
        "description": "Maintain a 3-day streak",
        "icon": "🔥",
        "type": AchievementType.STREAK,
        "requirement_value": 3,
        "xp_reward": 30
    },
    {
        "key": "week_warrior",
        "title": "Week Warrior",
        "description": "Maintain a 7-day streak",
        "icon": "📅",
        "type": AchievementType.STREAK,
        "requirement_value": 7,
        "xp_reward": 75
    },
    {
        "key": "streak_legend",
        "title": "Streak Legend",
        "description": "Maintain a 30-day streak",
        "icon": "🏆",
        "type": AchievementType.STREAK,
        "requirement_value": 30,
        "xp_reward": 300
    },
    {
        "key": "level_apprentice",
        "title": "Financial Apprentice",
        "description": "Reach level 5",
        "icon": "🌟",
        "type": AchievementType.LEVEL,
        "requirement_value": 5,
        "xp_reward": 100
    },
    {
        "key": "budgeto_master",
        "title": "Budgeto Master",
        "description": "Reach level 10",
        "icon": "💎",
        "type": AchievementType.LEVEL,
        "requirement_value": 10,
        "xp_reward": 250
    },
    {
        "key": "greek_hero",
        "title": "Greek Hero",
        "description": "Complete your first week of tracking",
        "icon": "🏛️",
        "type": AchievementType.SPECIAL,
        "requirement_value": 1,
        "xp_reward": 75
    },
    {
        "key": "spartan_discipline",
        "title": "Spartan Discipline",
        "description": "Stay under budget for a month",
        "icon": "⚔️",
        "type": AchievementType.SPENDING,
        "requirement_value": 1,
        "xp_reward": 150
    }
]

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