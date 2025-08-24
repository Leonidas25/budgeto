from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, col
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.models import User, Transaction, TransactionCreate, TransactionRead, TransactionUpdate, TransactionApprove
from app.models.enums import TransactionState, TransactionType
from app.db.database import get_session
from app.core.deps import get_current_active_user
from app.services.categorization import CategorizationEngine
from pydantic import BaseModel

router = APIRouter()

# Initialize categorization engine
categorization_engine = CategorizationEngine()

# Pydantic models for categorization
class CategorySuggestionRequest(BaseModel):
    description: str
    amount: float
    transaction_type: str = "expense"
    timestamp: Optional[datetime] = None

class CategorySuggestion(BaseModel):
    category: str
    confidence: float
    confidence_level: str
    reasons: List[str]
    explanation: str

@router.get("/", response_model=List[TransactionRead])
async def get_transactions(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=100),
    state: Optional[TransactionState] = None,
    type: Optional[TransactionType] = None
):
    """Get user's transactions with pagination and filters"""
    statement = select(Transaction).where(Transaction.user_id == current_user.id)
    
    if state:
        statement = statement.where(Transaction.state == state)
    if type:
        statement = statement.where(Transaction.type == type)
    
    statement = statement.order_by(col(Transaction.timestamp).desc()).offset(skip).limit(limit)
    transactions = session.exec(statement).all()
    
    return transactions

@router.get("/pending", response_model=List[TransactionRead])
async def get_pending_transactions(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get all pending transactions for approval"""
    statement = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.state == TransactionState.PENDING
    ).order_by(col(Transaction.timestamp).desc())
    
    transactions = session.exec(statement).all()
    return transactions

@router.post("/", response_model=TransactionRead, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    transaction_data: TransactionCreate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Create a new transaction"""
    db_transaction = Transaction(
        **transaction_data.dict(),
        user_id=current_user.id
    )
    
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    
    return db_transaction

@router.get("/{transaction_id}", response_model=TransactionRead)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get a specific transaction"""
    statement = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    )
    transaction = session.exec(statement).first()
    
    if not transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    return transaction

@router.put("/{transaction_id}", response_model=TransactionRead)
async def update_transaction(
    transaction_id: int,
    transaction_update: TransactionUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Update a transaction"""
    statement = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    )
    db_transaction = session.exec(statement).first()
    
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    # Update fields
    update_data = transaction_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_transaction, field, value)
    
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    
    return db_transaction

@router.post("/{transaction_id}/approve", response_model=TransactionRead)
async def approve_transaction(
    transaction_id: int,
    approval_data: Optional[TransactionApprove] = None,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Approve a pending transaction"""
    statement = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id,
        Transaction.state == TransactionState.PENDING
    )
    db_transaction = session.exec(statement).first()
    
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pending transaction not found"
        )
    
    # Update transaction with approval data
    if approval_data:
        if approval_data.category:
            db_transaction.category = approval_data.category
        if approval_data.description:
            db_transaction.description = approval_data.description
    
    db_transaction.state = TransactionState.APPROVED
    db_transaction.approved_at = datetime.utcnow()
    
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    
    # Award XP for transaction approval
    try:
        from app.api.gamification import award_xp_internal
        await award_xp_internal(current_user.id, 'transaction_approved', session)
    except Exception as e:
        # Log error but don't fail the transaction approval
        print(f"Failed to award XP: {e}")
    
    # Check for new achievements
    newly_unlocked_achievements = []
    try:
        from app.services.achievement_service import AchievementService
        achievement_service = AchievementService(session)
        newly_unlocked_achievements = await achievement_service.check_and_unlock_achievements(current_user.id)
    except Exception as e:
        # Log error but don't fail the transaction approval
        print(f"Failed to check achievements: {e}")
    
    # TODO: Update budget calculations
    
    # Return transaction with achievement info
    result = TransactionRead.from_orm(db_transaction)
    
    # Add achievement info to response if any were unlocked
    if newly_unlocked_achievements:
        # Note: This would require extending the TransactionRead model to include achievement info
        # For now, we'll log it
        print(f"User {current_user.id} unlocked {len(newly_unlocked_achievements)} achievements after transaction approval")
    
    return result

@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Delete a transaction"""
    statement = select(Transaction).where(
        Transaction.id == transaction_id,
        Transaction.user_id == current_user.id
    )
    db_transaction = session.exec(statement).first()
    
    if not db_transaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Transaction not found"
        )
    
    session.delete(db_transaction)
    session.commit()
    
    return None

@router.post("/suggest-category", response_model=List[CategorySuggestion])
async def suggest_transaction_category(
    request: CategorySuggestionRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get AI-powered category suggestions for a transaction"""
    
    # Get user's transaction history for better suggestions
    history_statement = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.state == TransactionState.APPROVED
    ).order_by(col(Transaction.timestamp).desc()).limit(100)
    
    user_transactions = session.exec(history_statement).all()
    user_history = [
        {
            "description": t.description,
            "amount": float(t.amount),
            "category": t.category,
            "timestamp": t.timestamp
        }
        for t in user_transactions
    ]
    
    # Get suggestions from categorization engine
    suggestions = categorization_engine.suggest_category(
        description=request.description,
        amount=request.amount,
        transaction_type=request.transaction_type,
        timestamp=request.timestamp,
        user_history=user_history
    )
    
    # Convert to response format
    response_suggestions = []
    for suggestion in suggestions:
        confidence_level = categorization_engine.get_confidence_level(suggestion["confidence"])
        explanation = categorization_engine.explain_suggestion(suggestion)
        
        response_suggestions.append(CategorySuggestion(
            category=suggestion["category"],
            confidence=suggestion["confidence"],
            confidence_level=confidence_level.name.lower().replace('_', ' '),
            reasons=suggestion["reasons"],
            explanation=explanation
        ))
    
    return response_suggestions

@router.get("/categories/popular")
async def get_popular_categories(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
    limit: int = Query(10, le=20)
) -> Dict[str, Any]:
    """Get user's most frequently used categories"""
    
    # Get user's approved transactions
    statement = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.state == TransactionState.APPROVED
    )
    
    transactions = session.exec(statement).all()
    
    # Count category usage
    category_counts = {}
    category_amounts = {}
    
    for transaction in transactions:
        category = transaction.category
        if category:
            category_counts[category] = category_counts.get(category, 0) + 1
            category_amounts[category] = category_amounts.get(category, 0) + float(transaction.amount)
    
    # Sort by usage frequency
    sorted_categories = sorted(
        category_counts.items(), 
        key=lambda x: x[1], 
        reverse=True
    )[:limit]
    
    # Format response
    popular_categories = []
    for category, count in sorted_categories:
        avg_amount = category_amounts[category] / count if count > 0 else 0
        popular_categories.append({
            "category": category,
            "usage_count": count,
            "average_amount": round(avg_amount, 2),
            "total_amount": round(category_amounts[category], 2)
        })
    
    return {
        "popular_categories": popular_categories,
        "total_categories_used": len(category_counts),
        "total_transactions": len(transactions)
    }

@router.get("/stats/summary")
async def get_transaction_summary(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get comprehensive transaction summary statistics"""
    from datetime import date, timedelta
    from collections import defaultdict
    from app.models.enums import TransactionCategory
    
    today = date.today()
    first_day_current = today.replace(day=1)
    
    # Calculate previous month for comparison
    if today.month == 1:
        first_day_previous = date(today.year - 1, 12, 1)
        last_day_previous = date(today.year - 1, 12, 31)
    else:
        first_day_previous = date(today.year, today.month - 1, 1)
        # Get last day of previous month
        last_day_previous = (first_day_current - timedelta(days=1))
    
    # Current month approved transactions
    current_statement = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.state == TransactionState.APPROVED,
        col(Transaction.timestamp) >= first_day_current
    )
    current_transactions = session.exec(current_statement).all()
    
    # Previous month approved transactions for comparison
    previous_statement = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.state == TransactionState.APPROVED,
        col(Transaction.timestamp) >= first_day_previous,
        col(Transaction.timestamp) < first_day_current
    )
    previous_transactions = session.exec(previous_statement).all()
    
    # Current month calculations
    current_income = sum(t.amount for t in current_transactions if t.type == TransactionType.INCOME)
    current_expenses = sum(t.amount for t in current_transactions if t.type == TransactionType.EXPENSE)
    
    # Previous month calculations
    previous_income = sum(t.amount for t in previous_transactions if t.type == TransactionType.INCOME)
    previous_expenses = sum(t.amount for t in previous_transactions if t.type == TransactionType.EXPENSE)
    
    # Category breakdown for current month
    expense_by_category = defaultdict(float)
    income_by_category = defaultdict(float)
    
    for transaction in current_transactions:
        if transaction.type == TransactionType.EXPENSE:
            expense_by_category[transaction.category.value] += float(transaction.amount)
        else:
            income_by_category[transaction.category.value] += float(transaction.amount)
    
    # Recent transactions (last 7 days)
    week_ago = today - timedelta(days=7)
    recent_statement = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.state == TransactionState.APPROVED,
        col(Transaction.timestamp) >= week_ago
    ).order_by(col(Transaction.timestamp).desc()).limit(5)
    recent_transactions = session.exec(recent_statement).all()
    
    # Pending transactions
    pending_statement = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.state == TransactionState.PENDING
    )
    pending_transactions = session.exec(pending_statement).all()
    pending_count = len(pending_transactions)
    
    # Calculate trends
    income_trend = 0
    expense_trend = 0
    if previous_income > 0:
        income_trend = ((current_income - previous_income) / previous_income) * 100
    if previous_expenses > 0:
        expense_trend = ((current_expenses - previous_expenses) / previous_expenses) * 100
    
    # Average daily spending this month
    days_in_month = today.day
    daily_average = float(current_expenses) / days_in_month if days_in_month > 0 else 0
    
    return {
        "current_month": {
            "total_income": float(current_income),
            "total_expenses": float(current_expenses),
            "net_amount": float(current_income - current_expenses),
            "transaction_count": len(current_transactions),
            "daily_average_spending": round(daily_average, 2),
            "expense_by_category": dict(expense_by_category),
            "income_by_category": dict(income_by_category)
        },
        "previous_month": {
            "total_income": float(previous_income),
            "total_expenses": float(previous_expenses),
            "net_amount": float(previous_income - previous_expenses),
            "transaction_count": len(previous_transactions)
        },
        "trends": {
            "income_change_percent": round(income_trend, 1),
            "expense_change_percent": round(expense_trend, 1)
        },
        "recent_transactions": [
            {
                "id": t.id,
                "amount": float(t.amount),
                "type": t.type.value,
                "category": t.category.value,
                "description": t.description,
                "timestamp": t.timestamp.isoformat()
            } for t in recent_transactions
        ],
        "pending_transactions": pending_count,
        "pending_amount": sum(float(t.amount) for t in pending_transactions)
    }