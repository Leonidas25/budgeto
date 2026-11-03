from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from datetime import date, datetime, timedelta
from app.models import User, UserGamification, UserGamificationRead, WeeklyInsight, Transaction
from app.models.gamification import calculate_level, XP_REWARDS
from app.models.enums import TransactionState
from app.db.database import get_session
from app.core.deps import get_current_active_user
import random

router = APIRouter()

@router.get("/me", response_model=UserGamificationRead)
async def get_my_gamification(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get current user's gamification stats"""
    statement = select(UserGamification).where(UserGamification.user_id == current_user.id)
    gamification = session.exec(statement).first()
    
    if not gamification:
        # Create gamification profile if it doesn't exist
        gamification = UserGamification(user_id=current_user.id)
        session.add(gamification)
        session.commit()
        session.refresh(gamification)
    
    # Calculate level and progress
    level, xp_to_next, progress_percentage = calculate_level(gamification.xp)
    
    result = UserGamificationRead.from_orm(gamification)
    result.xp_to_next_level = xp_to_next
    result.level_progress_percentage = progress_percentage
    
    return result

@router.post("/award-xp/{action}")
async def award_xp(
    action: str,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Award XP for a specific action"""
    if action not in XP_REWARDS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown action: {action}"
        )
    
    statement = select(UserGamification).where(UserGamification.user_id == current_user.id)
    gamification = session.exec(statement).first()
    
    if not gamification:
        gamification = UserGamification(user_id=current_user.id)
        session.add(gamification)
    
    # Award XP
    xp_amount = XP_REWARDS[action]
    old_level = calculate_level(gamification.xp)[0]
    gamification.xp += xp_amount
    new_level = calculate_level(gamification.xp)[0]
    
    # Update activity tracking
    if action == 'transaction_approved':
        gamification.total_transactions_approved += 1
    elif action == 'budget_goal_met':
        gamification.total_budgets_met += 1
    
    # Update streak for daily activities
    if action in ['daily_login', 'transaction_approved']:
        today = date.today()
        if gamification.last_activity == today - timedelta(days=1):
            gamification.streak_count += 1
        elif gamification.last_activity != today:
            gamification.streak_count = 1
        gamification.last_activity = today
    
    gamification.updated_at = datetime.utcnow()
    session.add(gamification)
    session.commit()
    session.refresh(gamification)
    
    # Check for level up
    level_up = new_level > old_level
    
    return {
        "xp_awarded": xp_amount,
        "total_xp": gamification.xp,
        "level": new_level,
        "level_up": level_up,
        "streak_count": gamification.streak_count
    }

@router.get("/insights", response_model=List[WeeklyInsight])
async def get_weekly_insights(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get weekly insights with Greek humor"""
    # Get current week's start (Monday)
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    
    # Get approved transactions from this week
    statement = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.state == TransactionState.APPROVED,
        Transaction.timestamp >= week_start
    )
    
    transactions = session.exec(statement).all()
    
    insights = generate_greek_insights(transactions, current_user, week_start)
    
    return insights

def generate_greek_insights(transactions: List[Transaction], user: User, week_start: date) -> List[WeeklyInsight]:
    """Generate funny Greek-themed insights"""
    insights = []
    
    if not transactions:
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message="Silence is golden, but your wallet is even more golden this week! 🏆",
            category="achievement",
            is_funny=True
        ))
        return insights
    
    # Calculate spending by category
    from collections import defaultdict
    from app.models.enums import TransactionType, TransactionCategory
    
    spending_by_category = defaultdict(float)
    total_expenses = 0
    total_income = 0
    
    for transaction in transactions:
        if transaction.type == TransactionType.EXPENSE:
            spending_by_category[transaction.category] += float(transaction.amount)
            total_expenses += float(transaction.amount)
        else:
            total_income += float(transaction.amount)
    
    # Greek-themed insight messages
    GREEK_INSIGHTS = {
        TransactionCategory.FOOD: [
            f"You've spent €{spending_by_category[TransactionCategory.FOOD]:.2f} on food this week. Even Dionysus would be impressed! 🍷",
            f"Your taverna visits could fund a small Greek island! €{spending_by_category[TransactionCategory.FOOD]:.2f} on food 🏝️",
            f"You're eating like Zeus at Mount Olympus! €{spending_by_category[TransactionCategory.FOOD]:.2f} on food this week ⚡"
        ],
        TransactionCategory.TRANSPORT: [
            f"€{spending_by_category[TransactionCategory.TRANSPORT]:.2f} on transport. You're traveling more than Odysseus! ⚓",
            f"Metro tickets and taxis: €{spending_by_category[TransactionCategory.TRANSPORT]:.2f}. Athens traffic got you again? 🚇"
        ],
        TransactionCategory.DRINKS: [
            f"€{spending_by_category[TransactionCategory.DRINKS]:.2f} on drinks. Living the Greek nightlife to the fullest! 🌙",
            f"Your bar budget this week: €{spending_by_category[TransactionCategory.DRINKS]:.2f}. Opa! 🍺"
        ]
    }
    
    # Generate category-specific insights
    for category, amount in spending_by_category.items():
        if amount > 0 and category in GREEK_INSIGHTS:
            message = random.choice(GREEK_INSIGHTS[category])
            insights.append(WeeklyInsight(
                user_id=user.id,
                week_start=week_start,
                message=message,
                category="spending",
                is_funny=True
            ))
    
    # Overall spending insights
    if total_expenses > 100:
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message=f"€{total_expenses:.2f} spent this week. Even ancient Greeks would applaud this economy! 🏛️",
            category="spending",
            is_funny=True
        ))
    elif total_expenses < 20:
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message="Your budgeting skills are more legendary than the Odyssey! 📚",
            category="achievement",
            is_funny=True
        ))
    
    # Positive income insights
    if total_income > 0:
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message=f"€{total_income:.2f} earned this week. Midas would be jealous! ✨",
            category="achievement",
            is_funny=True
        ))
    
    # Return at least one insight
    if not insights:
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message="Keep tracking your expenses like a true philosopher! Socrates would be proud 🧠",
            category="tip",
            is_funny=True
        ))
    
    return insights[:3]  # Limit to 3 insights

@router.get("/leaderboard")
async def get_leaderboard(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get XP leaderboard (for future social features)"""
    statement = select(UserGamification).order_by(UserGamification.xp.desc()).limit(10)
    top_users = session.exec(statement).all()
    
    leaderboard = []
    for i, user_gamification in enumerate(top_users, 1):
        level, _, _ = calculate_level(user_gamification.xp)
        leaderboard.append({
            "rank": i,
            "user_id": user_gamification.user_id,
            "xp": user_gamification.xp,
            "level": level,
            "is_current_user": user_gamification.user_id == current_user.id
        })
    
    return {"leaderboard": leaderboard}