from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select, col
from typing import List, Optional
from datetime import datetime
from app.models import User, Transaction, TransactionCreate, TransactionRead, TransactionUpdate, TransactionApprove
from app.models.enums import TransactionState, TransactionType
from app.db.database import get_session
from app.core.deps import get_current_active_user

router = APIRouter()

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
    
    # TODO: Award XP for transaction approval
    # TODO: Update budget calculations
    
    return db_transaction

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

@router.get("/stats/summary")
async def get_transaction_summary(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Get transaction summary statistics"""
    # Get approved transactions for current month
    from datetime import date
    today = date.today()
    first_day = today.replace(day=1)
    
    statement = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.state == TransactionState.APPROVED,
        col(Transaction.timestamp) >= first_day
    )
    
    transactions = session.exec(statement).all()
    
    total_income = sum(t.amount for t in transactions if t.type == TransactionType.INCOME)
    total_expenses = sum(t.amount for t in transactions if t.type == TransactionType.EXPENSE)
    
    # Get pending count
    pending_statement = select(Transaction).where(
        Transaction.user_id == current_user.id,
        Transaction.state == TransactionState.PENDING
    )
    pending_count = len(session.exec(pending_statement).all())
    
    return {
        "current_month": {
            "total_income": total_income,
            "total_expenses": total_expenses,
            "net_amount": total_income - total_expenses,
            "transaction_count": len(transactions)
        },
        "pending_transactions": pending_count
    }