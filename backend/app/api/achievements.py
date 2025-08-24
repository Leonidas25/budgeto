from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from typing import List, Dict, Any
from app.models import User
from app.models.gamification import AchievementRead, NotificationRead
from app.db.database import get_session
from app.core.deps import get_current_active_user
from app.services.achievement_service import AchievementService
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/achievements", response_model=List[AchievementRead])
async def get_user_achievements(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get all achievements with user progress"""
    service = AchievementService(session)
    
    # Initialize achievements if needed
    await service.initialize_achievements()
    
    # Get user achievements with progress
    achievements = await service.get_user_achievements(current_user.id)
    
    return achievements

@router.post("/check-achievements")
async def check_achievements(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Check and unlock new achievements for user"""
    service = AchievementService(session)
    
    # Check for new achievements
    newly_unlocked = await service.check_and_unlock_achievements(current_user.id)
    
    return {
        "newly_unlocked": newly_unlocked,
        "count": len(newly_unlocked)
    }

@router.get("/notifications")
async def get_notifications(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get unread notifications for user"""
    service = AchievementService(session)
    notifications = await service.get_unread_notifications(current_user.id)
    
    return {
        "notifications": notifications,
        "count": len(notifications)
    }

@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Mark a specific notification as read"""
    service = AchievementService(session)
    success = await service.mark_notification_read(current_user.id, notification_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    return {"success": True}

@router.post("/notifications/read-all")
async def mark_all_notifications_read(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Mark all notifications as read for user"""
    service = AchievementService(session)
    count = await service.mark_all_notifications_read(current_user.id)
    
    return {
        "success": True,
        "marked_read": count
    }

@router.get("/achievement-stats")
async def get_achievement_stats(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get achievement statistics for user"""
    service = AchievementService(session)
    achievements = await service.get_user_achievements(current_user.id)
    
    total_achievements = len(achievements)
    unlocked_achievements = len([a for a in achievements if a.unlocked])
    completion_rate = (unlocked_achievements / total_achievements * 100) if total_achievements > 0 else 0
    
    # Calculate total XP from achievements
    total_achievement_xp = sum(a.xp_reward for a in achievements if a.unlocked)
    
    # Get recent achievements (last 7 days)
    from datetime import datetime, timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    recent_achievements = [
        a for a in achievements 
        if a.unlocked and a.unlocked_at and a.unlocked_at >= week_ago
    ]
    
    return {
        "total_achievements": total_achievements,
        "unlocked_achievements": unlocked_achievements,
        "completion_rate": completion_rate,
        "total_achievement_xp": total_achievement_xp,
        "recent_achievements": len(recent_achievements),
        "achievement_categories": {
            "transaction_count": len([a for a in achievements if a.type == "transaction_count"]),
            "streak": len([a for a in achievements if a.type == "streak"]),
            "level": len([a for a in achievements if a.type == "level"]),
            "spending": len([a for a in achievements if a.type == "spending"]),
            "special": len([a for a in achievements if a.type == "special"])
        }
    }