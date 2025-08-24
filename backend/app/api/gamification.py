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

# Internal function for awarding XP from other modules
async def award_xp_internal(user_id: int, action: str, session: Session) -> dict:
    """Internal function to award XP without requiring current_user dependency"""
    if action not in XP_REWARDS:
        raise ValueError(f"Unknown action: {action}")
    
    statement = select(UserGamification).where(UserGamification.user_id == user_id)
    gamification = session.exec(statement).first()
    
    if not gamification:
        gamification = UserGamification(user_id=user_id)
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
        messages = [
            "Silence is golden, but your wallet is even more golden this week! 🏆",
            "Even the Oracle of Delphi couldn't predict such perfect spending restraint! 🔮",
            "Your wallet is having a more peaceful week than a monastery on Mount Athos! ⛪",
            "Zeus himself would be proud of this financial discipline! ⚡"
        ]
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message=random.choice(messages),
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
    transaction_count = len(transactions)
    
    for transaction in transactions:
        if transaction.type == TransactionType.EXPENSE:
            spending_by_category[transaction.category] += float(transaction.amount)
            total_expenses += float(transaction.amount)
        else:
            total_income += float(transaction.amount)
    
    # Enhanced Greek-themed insight messages
    GREEK_INSIGHTS = {
        TransactionCategory.FOOD: [
            f"€{spending_by_category[TransactionCategory.FOOD]:.2f} on food this week. Even Dionysus would be impressed with this feast! 🍷",
            f"Your taverna visits (€{spending_by_category[TransactionCategory.FOOD]:.2f}) could fund a small Greek island! 🏝️",
            f"You're eating like Zeus at Mount Olympus! €{spending_by_category[TransactionCategory.FOOD]:.2f} on food this week ⚡",
            f"€{spending_by_category[TransactionCategory.FOOD]:.2f} on food! Ancient Greeks survived on bread and olives, but you're living the modern dream! 🫒",
            f"With €{spending_by_category[TransactionCategory.FOOD]:.2f} on food, you're single-handedly supporting Greek agriculture! 🌾"
        ],
        TransactionCategory.TRANSPORT: [
            f"€{spending_by_category[TransactionCategory.TRANSPORT]:.2f} on transport. You're traveling more than Odysseus! ⚓",
            f"Metro tickets and taxis: €{spending_by_category[TransactionCategory.TRANSPORT]:.2f}. Athens traffic got you again? 🚇",
            f"€{spending_by_category[TransactionCategory.TRANSPORT]:.2f} on transport! Even Hermes would be jealous of your mobility! 🏃‍♂️",
            f"With €{spending_by_category[TransactionCategory.TRANSPORT]:.2f} spent, you're funding half the Greek public transport system! 🚌"
        ],
        TransactionCategory.DRINKS: [
            f"€{spending_by_category[TransactionCategory.DRINKS]:.2f} on drinks. Living the Greek nightlife to the fullest! 🌙",
            f"Your bar budget this week: €{spending_by_category[TransactionCategory.DRINKS]:.2f}. Opa! 🍺",
            f"€{spending_by_category[TransactionCategory.DRINKS]:.2f} on drinks! The ancient symposiums would pale in comparison! 🍾",
            f"With €{spending_by_category[TransactionCategory.DRINKS]:.2f} on drinks, you're keeping Greek hospitality alive! 🥂"
        ],
        TransactionCategory.SHOPPING: [
            f"€{spending_by_category[TransactionCategory.SHOPPING]:.2f} on shopping! Ancient Greek agoras were the first shopping centers, and you're honoring that tradition! 🛍️",
            f"Your shopping spree: €{spending_by_category[TransactionCategory.SHOPPING]:.2f}. Even Aphrodite would approve of this style investment! 💄",
            f"€{spending_by_category[TransactionCategory.SHOPPING]:.2f} spent shopping! You're boosting the economy like a true Greek patriot! 🇬🇷"
        ],
        TransactionCategory.ENTERTAINMENT: [
            f"€{spending_by_category[TransactionCategory.ENTERTAINMENT]:.2f} on entertainment! The Muses themselves would applaud your cultural investment! 🎭",
            f"Entertainment budget: €{spending_by_category[TransactionCategory.ENTERTAINMENT]:.2f}. Living life like an ancient Greek festival! 🎪",
            f"€{spending_by_category[TransactionCategory.ENTERTAINMENT]:.2f} on fun! Socrates said 'The unexamined life is not worth living' - but yours is definitely worth living! 🎉"
        ],
        TransactionCategory.EDUCATION: [
            f"€{spending_by_category[TransactionCategory.EDUCATION]:.2f} on education! Aristotle would be proud of your pursuit of knowledge! 📚",
            f"Educational expenses: €{spending_by_category[TransactionCategory.EDUCATION]:.2f}. Investment in wisdom worthy of ancient Athens! 🦉",
            f"€{spending_by_category[TransactionCategory.EDUCATION]:.2f} on learning! You're following in the footsteps of Plato and Aristotle! 🏛️"
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
    
    # Overall spending insights with Greek humor
    if total_expenses > 200:
        messages = [
            f"€{total_expenses:.2f} spent this week! Even Alexander the Great would be impressed by this economic conquest! 🏛️",
            f"Your €{total_expenses:.2f} spending spree could fund a small archaeological dig! 🏺",
            f"€{total_expenses:.2f} this week! You're living like a modern Croesus! 👑"
        ]
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message=random.choice(messages),
            category="spending",
            is_funny=True
        ))
    elif total_expenses > 100:
        messages = [
            f"€{total_expenses:.2f} spent this week. Even ancient Greeks would applaud this balanced economy! 🏛️",
            f"€{total_expenses:.2f} spending - perfectly balanced, as all Greek budgets should be! ⚖️",
            f"Your €{total_expenses:.2f} weekly spending shows wisdom worthy of Athena! 🦉"
        ]
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message=random.choice(messages),
            category="spending",
            is_funny=True
        ))
    elif total_expenses < 20:
        messages = [
            "Your budgeting skills are more legendary than the Odyssey! 📚",
            "Such restraint! Even Spartan warriors would admire this discipline! ⚔️",
            "Your wallet is more protected than the Acropolis! 🏛️",
            "Frugality level: Ancient Greek philosopher! 🧠"
        ]
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message=random.choice(messages),
            category="achievement",
            is_funny=True
        ))
    
    # Income insights with Greek flair
    if total_income > 500:
        messages = [
            f"€{total_income:.2f} earned this week! Midas himself would be jealous! ✨",
            f"€{total_income:.2f} income! You're richer than a Byzantine emperor! 👑",
            f"Your €{total_income:.2f} earnings could fund the rebuilding of the Colossus of Rhodes! 🗿"
        ]
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message=random.choice(messages),
            category="achievement",
            is_funny=True
        ))
    elif total_income > 0:
        messages = [
            f"€{total_income:.2f} earned this week. The gods of fortune smile upon you! ✨",
            f"Income: €{total_income:.2f}. Every drachma counts in building your empire! 🏛️",
            f"€{total_income:.2f} earned! Your financial Odyssey continues! ⚓"
        ]
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message=random.choice(messages),
            category="achievement",
            is_funny=True
        ))
    
    # Transaction frequency insights
    if transaction_count >= 15:
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message=f"{transaction_count} transactions this week! You're more active than the Athenian marketplace! 🏺",
            category="tip",
            is_funny=True
        ))
    elif transaction_count >= 7:
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message=f"{transaction_count} transactions tracked! Consistency worthy of a Greek philosopher! 📜",
            category="achievement",
            is_funny=True
        ))
    
    # Weekly wisdom tips
    wisdom_tips = [
        "Remember: Even Socrates knew that knowing your expenses is knowing yourself! 🧠",
        "Ancient Greek wisdom: 'Moderation in all things' - especially spending! ⚖️",
        "Like the Oracle of Delphi said: 'Know thyself' - and your budget! 🔮",
        "Aristotle believed in the golden mean - find yours in spending! 🏛️",
        "Track your drachmas like an ancient Greek merchant! 💰"
    ]
    
    # Return at least one insight, add a wisdom tip if needed
    if not insights:
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message="Keep tracking your expenses like a true philosopher! Socrates would be proud 🧠",
            category="tip",
            is_funny=True
        ))
    elif len(insights) < 2:
        insights.append(WeeklyInsight(
            user_id=user.id,
            week_start=week_start,
            message=random.choice(wisdom_tips),
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