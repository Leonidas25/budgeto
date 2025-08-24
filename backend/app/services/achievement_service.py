from typing import List, Optional, Dict, Any
from sqlmodel import Session, select
from datetime import datetime, timedelta, date
from app.models import User, UserGamification, Transaction
from app.models.enums import TransactionState
from app.models.gamification import (
    Achievement, UserAchievement, Notification, AchievementType, 
    NotificationType, ACHIEVEMENTS, AchievementRead, calculate_level
)
import logging

logger = logging.getLogger(__name__)

class AchievementService:
    """Service for managing achievements, progress tracking, and notifications"""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def initialize_achievements(self) -> None:
        """Initialize all achievements in the database if they don't exist"""
        for achievement_data in ACHIEVEMENTS:
            # Check if achievement already exists
            statement = select(Achievement).where(Achievement.key == achievement_data["key"])
            existing = self.session.exec(statement).first()
            
            if not existing:
                achievement = Achievement(**achievement_data)
                self.session.add(achievement)
                logger.info(f"Created achievement: {achievement_data['key']}")
        
        self.session.commit()
    
    async def check_and_unlock_achievements(self, user_id: int) -> List[AchievementRead]:
        """Check if user has unlocked new achievements and process them"""
        newly_unlocked = []
        
        # Get user data
        user_data = await self._get_user_achievement_data(user_id)
        
        # Get all achievements
        statement = select(Achievement).where(Achievement.is_active == True)
        all_achievements = self.session.exec(statement).all()
        
        # Get user's existing achievements
        user_achievements_stmt = select(UserAchievement).where(UserAchievement.user_id == user_id)
        user_achievements = self.session.exec(user_achievements_stmt).all()
        unlocked_achievement_ids = {ua.achievement_id for ua in user_achievements}
        
        for achievement in all_achievements:
            if achievement.id in unlocked_achievement_ids:
                continue  # Already unlocked
            
            # Check if achievement should be unlocked
            current_value = await self._get_current_value_for_achievement(achievement, user_data)
            
            if current_value >= achievement.requirement_value:
                # Unlock achievement
                user_achievement = UserAchievement(
                    user_id=user_id,
                    achievement_id=achievement.id,
                    unlocked_at=datetime.utcnow(),
                    notified=False
                )
                
                self.session.add(user_achievement)
                
                # Create notification
                await self._create_achievement_notification(user_id, achievement)
                
                # Award XP bonus
                if achievement.xp_reward > 0:
                    await self._award_achievement_xp(user_id, achievement.xp_reward)
                
                # Create achievement read object
                achievement_read = AchievementRead(
                    id=achievement.id,
                    key=achievement.key,
                    title=achievement.title,
                    description=achievement.description,
                    icon=achievement.icon,
                    type=achievement.type,
                    requirement_value=achievement.requirement_value,
                    xp_reward=achievement.xp_reward,
                    unlocked=True,
                    unlocked_at=datetime.utcnow(),
                    progress=1.0,
                    current_value=current_value
                )
                
                newly_unlocked.append(achievement_read)
                
                logger.info(f"User {user_id} unlocked achievement: {achievement.key}")
        
        self.session.commit()
        return newly_unlocked
    
    async def get_user_achievements(self, user_id: int) -> List[AchievementRead]:
        """Get all achievements with user progress"""
        # Get user data for progress calculation
        user_data = await self._get_user_achievement_data(user_id)
        
        # Get all achievements
        statement = select(Achievement).where(Achievement.is_active == True).order_by(Achievement.id)
        all_achievements = self.session.exec(statement).all()
        
        # Get user's unlocked achievements
        user_achievements_stmt = select(UserAchievement).where(UserAchievement.user_id == user_id)
        user_achievements = self.session.exec(user_achievements_stmt).all()
        unlocked_map = {ua.achievement_id: ua for ua in user_achievements}
        
        achievement_reads = []
        for achievement in all_achievements:
            current_value = await self._get_current_value_for_achievement(achievement, user_data)
            progress = min(current_value / achievement.requirement_value, 1.0) if achievement.requirement_value > 0 else 0.0
            
            unlocked_achievement = unlocked_map.get(achievement.id)
            
            achievement_read = AchievementRead(
                id=achievement.id,
                key=achievement.key,
                title=achievement.title,
                description=achievement.description,
                icon=achievement.icon,
                type=achievement.type,
                requirement_value=achievement.requirement_value,
                xp_reward=achievement.xp_reward,
                unlocked=unlocked_achievement is not None,
                unlocked_at=unlocked_achievement.unlocked_at if unlocked_achievement else None,
                progress=progress,
                current_value=current_value
            )
            
            achievement_reads.append(achievement_read)
        
        return achievement_reads
    
    async def get_unread_notifications(self, user_id: int) -> List[Dict[str, Any]]:
        """Get unread notifications for user"""
        statement = (
            select(Notification)
            .where(
                Notification.user_id == user_id,
                Notification.read == False,
                (Notification.expires_at.is_(None) | (Notification.expires_at > datetime.utcnow()))
            )
            .order_by(Notification.created_at.desc())
        )
        
        notifications = self.session.exec(statement).all()
        
        return [
            {
                "id": notification.id,
                "type": notification.type,
                "title": notification.title,
                "message": notification.message,
                "data": notification.data,
                "created_at": notification.created_at.isoformat()
            }
            for notification in notifications
        ]
    
    async def mark_notification_read(self, user_id: int, notification_id: int) -> bool:
        """Mark a notification as read"""
        statement = select(Notification).where(
            Notification.id == notification_id,
            Notification.user_id == user_id
        )
        notification = self.session.exec(statement).first()
        
        if notification:
            notification.read = True
            self.session.add(notification)
            self.session.commit()
            return True
        return False
    
    async def mark_all_notifications_read(self, user_id: int) -> int:
        """Mark all notifications as read for user"""
        statement = select(Notification).where(
            Notification.user_id == user_id,
            Notification.read == False
        )
        notifications = self.session.exec(statement).all()
        
        count = 0
        for notification in notifications:
            notification.read = True
            self.session.add(notification)
            count += 1
        
        self.session.commit()
        return count
    
    async def _get_user_achievement_data(self, user_id: int) -> Dict[str, Any]:
        """Get all data needed for achievement calculations"""
        # Get gamification data
        gamification_stmt = select(UserGamification).where(UserGamification.user_id == user_id)
        gamification = self.session.exec(gamification_stmt).first()
        
        if not gamification:
            # Create default gamification record
            gamification = UserGamification(user_id=user_id)
            self.session.add(gamification)
            self.session.commit()
            self.session.refresh(gamification)
        
        # Get transaction stats
        approved_transactions_stmt = select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.state == TransactionState.APPROVED
        )
        approved_transactions = self.session.exec(approved_transactions_stmt).all()
        
        # Calculate level
        current_level, _, _ = calculate_level(gamification.xp)
        
        # Calculate time-based achievements
        now = datetime.utcnow()
        week_ago = now - timedelta(days=7)
        
        # Check if user has been active for a week
        has_week_activity = bool(
            approved_transactions and 
            any(t.created_at >= week_ago for t in approved_transactions)
        )
        
        return {
            "total_transactions": len(approved_transactions),
            "current_streak": gamification.streak_count,
            "current_level": current_level,
            "total_xp": gamification.xp,
            "has_week_activity": has_week_activity,
            "total_transactions_approved": gamification.total_transactions_approved,
            "total_budgets_met": gamification.total_budgets_met
        }
    
    async def _get_current_value_for_achievement(self, achievement: Achievement, user_data: Dict[str, Any]) -> int:
        """Get current value for achievement progress"""
        if achievement.type == AchievementType.TRANSACTION_COUNT:
            return user_data["total_transactions"]
        elif achievement.type == AchievementType.STREAK:
            return user_data["current_streak"]
        elif achievement.type == AchievementType.LEVEL:
            return user_data["current_level"]
        elif achievement.type == AchievementType.SPENDING:
            return user_data["total_budgets_met"]
        elif achievement.type == AchievementType.SPECIAL:
            if achievement.key == "greek_hero":
                return 1 if user_data["has_week_activity"] else 0
            return 0
        return 0
    
    async def _create_achievement_notification(self, user_id: int, achievement: Achievement) -> None:
        """Create achievement unlock notification"""
        # Greek-themed achievement messages
        greek_messages = {
            "first_transaction": "Welcome to your financial odyssey! Your first transaction has been recorded! 🏛️",
            "transaction_warrior": "You're becoming a true Transaction Warrior! 10 transactions conquered! ⚡",
            "transaction_master": "Hail, Transaction Master! 50 transactions - the gods of finance smile upon you! 👑",
            "streak_starter": "Your discipline burns bright! 3-day streak achieved - Prometheus would be proud! 🔥",
            "week_warrior": "Seven days of perfect tracking! You're a true Week Warrior of ancient Greece! 📅",
            "greek_hero": "Congratulations, Greek Hero! You've completed your first week of financial tracking! 🏛️",
            "spartan_discipline": "Spartan-level discipline achieved! Your budgeting skills are legendary! ⚔️"
        }
        
        custom_message = greek_messages.get(achievement.key, f"Achievement unlocked: {achievement.title}!")
        
        notification = Notification(
            user_id=user_id,
            type=NotificationType.ACHIEVEMENT_UNLOCKED,
            title=f"🏆 {achievement.title} Unlocked!",
            message=custom_message,
            data={
                "achievement_id": achievement.id,
                "achievement_key": achievement.key,
                "xp_reward": achievement.xp_reward,
                "icon": achievement.icon
            },
            expires_at=datetime.utcnow() + timedelta(days=7)
        )
        
        self.session.add(notification)
    
    async def _award_achievement_xp(self, user_id: int, xp_amount: int) -> None:
        """Award XP for achievement unlock"""
        gamification_stmt = select(UserGamification).where(UserGamification.user_id == user_id)
        gamification = self.session.exec(gamification_stmt).first()
        
        if gamification:
            old_level, _, _ = calculate_level(gamification.xp)
            gamification.xp += xp_amount
            new_level, _, _ = calculate_level(gamification.xp)
            
            # Check for level up
            if new_level > old_level:
                # Create level up notification
                level_notification = Notification(
                    user_id=user_id,
                    type=NotificationType.LEVEL_UP,
                    title=f"🎆 Level Up!",
                    message=f"Congratulations! You've reached level {new_level}! The gods of Mount Olympus celebrate your progress! 🏛️",
                    data={
                        "old_level": old_level,
                        "new_level": new_level,
                        "total_xp": gamification.xp
                    },
                    expires_at=datetime.utcnow() + timedelta(days=3)
                )
                self.session.add(level_notification)
            
            self.session.add(gamification)
            logger.info(f"Awarded {xp_amount} XP to user {user_id} for achievement")