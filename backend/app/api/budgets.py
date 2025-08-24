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
    """Calculate budget progress based on approved transactions with enhanced tracking"""
    from collections import defaultdict
    
    if budget.type == BudgetType.MONTHLY:
        # For monthly budgets, calculate spending for current month
        today = date.today()
        first_day = today.replace(day=1)
        
        # Base query for approved transactions in current month
        base_statement = select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.state == TransactionState.APPROVED,
            col(Transaction.timestamp) >= first_day
        )
        
        # If budget has a specific category (name could be a category), filter by it
        # Check if budget name matches a transaction category
        category_spending = Decimal('0')
        
        # Try to match budget name with transaction categories for more accurate tracking
        if hasattr(budget, 'name') and budget.name:
            # Look for transactions that match the budget category/name
            category_statement = base_statement.where(
                Transaction.type == TransactionType.EXPENSE,
                Transaction.category.ilike(f"%{budget.name}%")
            )
            category_transactions = session.exec(category_statement).all()
            
            if category_transactions:
                # Use category-specific spending
                amount_spent = sum(t.amount for t in category_transactions)
            else:
                # Fall back to total spending if no category match
                all_expense_statement = base_statement.where(Transaction.type == TransactionType.EXPENSE)
                all_transactions = session.exec(all_expense_statement).all()
                amount_spent = sum(t.amount for t in all_transactions)
        else:
            # No specific category, use total expenses
            expense_statement = base_statement.where(Transaction.type == TransactionType.EXPENSE)
            transactions = session.exec(expense_statement).all()
            amount_spent = sum(t.amount for t in transactions)
        
        amount_remaining = max(budget.target_amount - amount_spent, Decimal('0'))
        progress_percentage = min((amount_spent / budget.target_amount) * 100, 100) if budget.target_amount > 0 else 0
        is_over_budget = amount_spent > budget.target_amount
        
        # Calculate days remaining in month
        import calendar
        _, last_day = calendar.monthrange(today.year, today.month)
        days_remaining = last_day - today.day
        
        # Add spending trend analysis
        days_elapsed = today.day
        daily_average = float(amount_spent) / days_elapsed if days_elapsed > 0 else 0
        projected_monthly_spending = daily_average * last_day
        
    else:  # GOAL type - Enhanced goal tracking
        today = date.today()
        
        # For savings goals, we need to track actual savings/contributions
        # Method 1: Look for income transactions since goal creation
        income_statement = select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.state == TransactionState.APPROVED,
            Transaction.type == TransactionType.INCOME,
            col(Transaction.timestamp) >= budget.created_at
        )
        
        # Method 2: Calculate net savings (income - expenses) since goal creation
        all_statement = select(Transaction).where(
            Transaction.user_id == user_id,
            Transaction.state == TransactionState.APPROVED,
            col(Transaction.timestamp) >= budget.created_at
        )
        
        all_transactions = session.exec(all_statement).all()
        total_income = sum(t.amount for t in all_transactions if t.type == TransactionType.INCOME)
        total_expenses = sum(t.amount for t in all_transactions if t.type == TransactionType.EXPENSE)
        
        # Enhanced goal calculation
        # Option 1: Use a configurable savings rate (default 20%)
        savings_rate = Decimal('0.2')  # 20% default, could be configurable per user
        potential_savings = total_income * savings_rate
        
        # Option 2: Use actual net savings if positive
        actual_net_savings = total_income - total_expenses
        
        # Use the lower of potential savings or actual net (if positive)
        if actual_net_savings > 0:
            amount_spent = min(potential_savings, actual_net_savings)
        else:
            amount_spent = Decimal('0')  # No savings if spending exceeds income
        
        amount_remaining = max(budget.target_amount - amount_spent, Decimal('0'))
        progress_percentage = min((amount_spent / budget.target_amount) * 100, 100) if budget.target_amount > 0 else 0
        is_over_budget = False  # Goals don't "go over budget"
        
        # Calculate days remaining until deadline
        days_remaining = None
        if budget.deadline:
            deadline_date = budget.deadline
            if isinstance(deadline_date, str):
                from datetime import datetime
                deadline_date = datetime.strptime(deadline_date, '%Y-%m-%d').date()
            days_remaining = (deadline_date - today).days
            
            # Calculate required daily savings rate
            if days_remaining > 0 and amount_remaining > 0:
                daily_savings_needed = float(amount_remaining) / days_remaining
            else:
                daily_savings_needed = 0
    
    # Enhanced progress object with additional metadata
    progress = BudgetProgress(
        budget_id=budget.id,
        amount_spent=amount_spent,
        amount_remaining=amount_remaining,
        progress_percentage=round(float(progress_percentage), 2),
        is_over_budget=is_over_budget,
        days_remaining=days_remaining
    )
    
    # Add additional calculated fields if they exist in the model
    if hasattr(progress, 'daily_average'):
        progress.daily_average = round(daily_average, 2) if budget.type == BudgetType.MONTHLY else None
    
    if hasattr(progress, 'projected_total'):
        progress.projected_total = round(projected_monthly_spending, 2) if budget.type == BudgetType.MONTHLY else None
    
    return progress