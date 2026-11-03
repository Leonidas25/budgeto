from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select, col
from typing import List
from datetime import date, datetime
from decimal import Decimal
from app.models import User, Budget, BudgetCreate, BudgetRead, BudgetUpdate, BudgetProgress, Transaction
from app.models.enums import BudgetType, TransactionType, TransactionState
from app.db.database import get_session
from app.core.deps import get_current_active_user

router = APIRouter()

@router.get("/", response_model=List[BudgetRead])
async def get_budgets(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session),
    active_only: bool = True
):
    """Get user's budgets"""
    statement = select(Budget).where(Budget.user_id == current_user.id)
    
    if active_only:
        statement = statement.where(Budget.is_active == True)
    
    statement = statement.order_by(col(Budget.created_at).desc())
    budgets = session.exec(statement).all()
    
    # Calculate progress for each budget
    budget_reads = []
    for budget in budgets:
        progress = await calculate_budget_progress(budget, current_user.id, session)
        budget_read = BudgetRead.from_orm(budget)
        budget_read.progress_percentage = progress.progress_percentage
        budget_reads.append(budget_read)
    
    return budget_reads

@router.post("/", response_model=BudgetRead, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_data: BudgetCreate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Create a new budget or goal"""
    # Check if user already has an active monthly budget
    if budget_data.type == BudgetType.MONTHLY:
        existing_statement = select(Budget).where(
            Budget.user_id == current_user.id,
            Budget.type == BudgetType.MONTHLY,
            Budget.is_active == True
        )
        existing_budget = session.exec(existing_statement).first()
        
        if existing_budget:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You already have an active monthly budget. Please deactivate it first."
            )
    
    db_budget = Budget(
        **budget_data.dict(),
        user_id=current_user.id
    )
    
    session.add(db_budget)
    session.commit()
    session.refresh(db_budget)
    
    return db_budget

@router.get("/{budget_id}", response_model=BudgetRead)
async def get_budget(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get a specific budget"""
    statement = select(Budget).where(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    )
    budget = session.exec(statement).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    return budget

@router.get("/{budget_id}/progress", response_model=BudgetProgress)
async def get_budget_progress(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get detailed budget progress"""
    statement = select(Budget).where(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    )
    budget = session.exec(statement).first()
    
    if not budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    progress = await calculate_budget_progress(budget, current_user.id, session)
    return progress

@router.put("/{budget_id}", response_model=BudgetRead)
async def update_budget(
    budget_id: int,
    budget_update: BudgetUpdate,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Update a budget"""
    statement = select(Budget).where(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    )
    db_budget = session.exec(statement).first()
    
    if not db_budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    update_data = budget_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_budget, field, value)
    
    db_budget.updated_at = datetime.utcnow()
    
    session.add(db_budget)
    session.commit()
    session.refresh(db_budget)
    
    return db_budget

@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Delete a budget"""
    statement = select(Budget).where(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    )
    db_budget = session.exec(statement).first()
    
    if not db_budget:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Budget not found"
        )
    
    session.delete(db_budget)
    session.commit()
    
    return None

async def calculate_budget_progress(budget: Budget, user_id: int, session: Session) -> BudgetProgress:
    """Calculate budget progress based on approved transactions"""
    if budget.type == BudgetType.MONTHLY:
        # For monthly budgets, calculate spending for current month
        today = date.today()
        first_day = today.replace(day=1)
        
        statement = select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.state == TransactionState.APPROVED,
            Transaction.type == TransactionType.EXPENSE,
            col(Transaction.timestamp) >= first_day
        )
        
        transactions = session.exec(statement).all()
        amount_spent = sum(t.amount for t in transactions)
        amount_remaining = budget.target_amount - amount_spent
        progress_percentage = min((amount_spent / budget.target_amount) * 100, 100)
        is_over_budget = amount_spent > budget.target_amount
        
        # Calculate days remaining in month
        import calendar
        _, last_day = calendar.monthrange(today.year, today.month)
        days_remaining = last_day - today.day
        
    else:  # GOAL type
        # For goals, calculate contributions (income transactions toward this goal)
        # For MVP, we'll use a simple approach where any income can contribute to goals
        statement = select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.state == TransactionState.APPROVED,
            Transaction.type == TransactionType.INCOME,
            col(Transaction.timestamp) >= budget.created_at
        )
        
        transactions = session.exec(statement).all()
        # Simple approach: assume 20% of income goes to savings goals
        total_income = sum(t.amount for t in transactions)
        amount_spent = total_income * Decimal('0.2')  # 20% savings rate
        amount_remaining = budget.target_amount - amount_spent
        progress_percentage = min((amount_spent / budget.target_amount) * 100, 100)
        is_over_budget = False
        
        # Calculate days remaining until deadline
        days_remaining = None
        if budget.deadline:
            days_remaining = (budget.deadline - date.today()).days
    
    return BudgetProgress(
        budget_id=budget.id,
        amount_spent=amount_spent,
        amount_remaining=max(amount_remaining, Decimal('0')),
        progress_percentage=round(progress_percentage, 2),
        is_over_budget=is_over_budget,
        days_remaining=days_remaining
    )