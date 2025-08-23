from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from pydantic import BaseModel
from typing import Optional
from app.models import User, Transaction, TransactionCreate, TransactionRead
from app.models.enums import TransactionSource, TransactionState
from app.db.database import get_session
from app.core.deps import get_current_active_user
from app.services.sms_parser import GreekSMSParser

router = APIRouter()

class SMSParseRequest(BaseModel):
    sms_text: str

class SMSParseResponse(BaseModel):
    success: bool
    transaction: Optional[TransactionRead] = None
    message: str
    confidence: Optional[float] = None

sms_parser = GreekSMSParser()

@router.post("/parse", response_model=SMSParseResponse)
async def parse_sms(
    request: SMSParseRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Parse a forwarded SMS and create a pending transaction"""
    
    # Parse the SMS
    parsed = sms_parser.parse_sms(request.sms_text)
    
    if not parsed:
        return SMSParseResponse(
            success=False,
            message="Could not parse SMS. Please check the format or add the transaction manually."
        )
    
    # Create a pending transaction
    transaction_data = TransactionCreate(
        amount=parsed.amount,
        type=parsed.type,
        category=parsed.suggested_category,
        description=parsed.description,
        source=TransactionSource.SMS,
        state=TransactionState.PENDING,
        suggested_category=parsed.suggested_category,
        original_sms=request.sms_text
    )
    
    db_transaction = Transaction(
        **transaction_data.dict(),
        user_id=current_user.id
    )
    
    session.add(db_transaction)
    session.commit()
    session.refresh(db_transaction)
    
    return SMSParseResponse(
        success=True,
        transaction=TransactionRead.from_orm(db_transaction),
        message=f"SMS parsed successfully! Found {parsed.type.value} of €{parsed.amount} from {parsed.bank}.",
        confidence=parsed.confidence
    )

@router.get("/test-patterns")
async def test_sms_patterns():
    """Test endpoint to show SMS parsing patterns (for development)"""
    sample_sms = {
        "NBG Debit": "NBG: Αγορά 15.50 EUR στο COFFEE ISLAND ATHENS",
        "Eurobank Credit": "Eurobank: Πίστωση 200.00 EUR - Monthly allowance",
        "IRIS Payment": "IRIS: Payment 3.50 EUR - Metro ticket",
        "Alpha Purchase": "Alpha Bank: Purchase 25.00 EUR at TAVERNA ZORBA"
    }
    
    results = {}
    for bank, sms in sample_sms.items():
        parsed = sms_parser.parse_sms(sms)
        if parsed:
            results[bank] = {
                "amount": str(parsed.amount),
                "type": parsed.type.value,
                "category": parsed.suggested_category.value,
                "description": parsed.description,
                "confidence": parsed.confidence
            }
        else:
            results[bank] = "Could not parse"
    
    return results