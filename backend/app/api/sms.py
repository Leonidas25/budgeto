from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.models import User, Transaction, TransactionCreate, TransactionRead
from app.models.enums import TransactionSource, TransactionState
from app.db.database import get_session
from app.core.deps import get_current_active_user
from app.services.enhanced_sms_parser import EnhancedGreekSMSParser
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

class SMSParseRequest(BaseModel):
    sms_text: str

class SMSParseResponse(BaseModel):
    success: bool
    transaction: Optional[TransactionRead] = None
    message: str
    confidence: Optional[float] = None
    parsing_method: Optional[str] = None
    bank_detected: Optional[str] = None
    merchant: Optional[str] = None
    errors: List[str] = []
    
class SMSBatchParseRequest(BaseModel):
    sms_texts: List[str]
    auto_approve_high_confidence: bool = False
    confidence_threshold: float = 0.8

sms_parser = EnhancedGreekSMSParser()

@router.post("/parse", response_model=SMSParseResponse)
async def parse_sms(
    request: SMSParseRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Parse a forwarded SMS and create a pending transaction with enhanced accuracy"""
    
    if not request.sms_text.strip():
        return SMSParseResponse(
            success=False,
            message="SMS text cannot be empty",
            errors=["Empty SMS text provided"]
        )
    
    try:
        # Parse the SMS with enhanced parser
        parsed = sms_parser.parse_sms(request.sms_text)
        
        if not parsed:
            logger.warning(f"Failed to parse SMS for user {current_user.id}: {request.sms_text[:100]}...")
            return SMSParseResponse(
                success=False,
                message="Could not parse SMS. Please check the format or add the transaction manually. Supported banks: NBG, Eurobank, Alpha, Piraeus, IRIS, PayPal, Revolut.",
                errors=["SMS format not recognized"]
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
        
        # Prepare success message with detailed info
        message_parts = [
            f"SMS parsed successfully! Found {parsed.type.value} of €{parsed.amount}"
        ]
        
        if parsed.bank != "Unknown":
            message_parts.append(f"from {parsed.bank}")
            
        if parsed.merchant:
            message_parts.append(f"at {parsed.merchant}")
            
        message_parts.append(f"(Confidence: {parsed.confidence:.0%})")
        
        success_message = " ".join(message_parts)
        
        logger.info(f"Successfully parsed SMS for user {current_user.id}: {parsed.parsing_method} method, confidence {parsed.confidence:.2f}")
        
        return SMSParseResponse(
            success=True,
            transaction=TransactionRead.from_orm(db_transaction),
            message=success_message,
            confidence=parsed.confidence,
            parsing_method=parsed.parsing_method,
            bank_detected=parsed.bank,
            merchant=parsed.merchant,
            errors=parsed.errors
        )
        
    except Exception as e:
        logger.error(f"Error parsing SMS for user {current_user.id}: {str(e)}")
        return SMSParseResponse(
            success=False,
            message="An error occurred while parsing the SMS. Please try again.",
            errors=[f"Internal error: {str(e)}"]
        )

@router.post("/batch-parse")
async def batch_parse_sms(
    request: SMSBatchParseRequest,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Parse multiple SMS messages at once"""
    
    if not request.sms_texts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No SMS texts provided"
        )
    
    results = []
    transactions_created = 0
    
    for i, sms_text in enumerate(request.sms_texts):
        try:
            parsed = sms_parser.parse_sms(sms_text)
            
            if parsed:
                # Determine if we should auto-approve based on confidence
                state = TransactionState.PENDING
                if (
                    request.auto_approve_high_confidence and 
                    parsed.confidence >= request.confidence_threshold
                ):
                    state = TransactionState.APPROVED
                
                # Create transaction
                transaction_data = TransactionCreate(
                    amount=parsed.amount,
                    type=parsed.type,
                    category=parsed.suggested_category,
                    description=parsed.description,
                    source=TransactionSource.SMS,
                    state=state,
                    suggested_category=parsed.suggested_category,
                    original_sms=sms_text
                )
                
                db_transaction = Transaction(
                    **transaction_data.dict(),
                    user_id=current_user.id
                )
                
                session.add(db_transaction)
                transactions_created += 1
                
                results.append({
                    "index": i,
                    "success": True,
                    "transaction_id": None,  # Will be set after commit
                    "confidence": parsed.confidence,
                    "parsing_method": parsed.parsing_method,
                    "bank": parsed.bank,
                    "amount": str(parsed.amount),
                    "type": parsed.type.value,
                    "auto_approved": state == TransactionState.APPROVED,
                    "errors": parsed.errors
                })
            else:
                results.append({
                    "index": i,
                    "success": False,
                    "error": "Could not parse SMS",
                    "sms_preview": sms_text[:50] + "..." if len(sms_text) > 50 else sms_text
                })
                
        except Exception as e:
            logger.error(f"Error in batch SMS parsing at index {i}: {str(e)}")
            results.append({
                "index": i,
                "success": False,
                "error": f"Processing error: {str(e)}"
            })
    
    # Commit all transactions
    try:
        session.commit()
        logger.info(f"Batch SMS parsing completed for user {current_user.id}: {transactions_created} transactions created")
    except Exception as e:
        session.rollback()
        logger.error(f"Error committing batch SMS transactions: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save transactions"
        )
    
    return {
        "total_processed": len(request.sms_texts),
        "transactions_created": transactions_created,
        "success_rate": transactions_created / len(request.sms_texts) if request.sms_texts else 0,
        "results": results
    }

@router.get("/parsing-stats")
async def get_parsing_stats(
    current_user: User = Depends(get_current_active_user)
):
    """Get parsing statistics and capabilities"""
    
    # Sample SMS messages for testing
    sample_messages = [
        "NBG: Αγορά 15.50 EUR στο COFFEE ISLAND ATHENS",
        "Eurobank: Πίστωση 200.00 EUR - Monthly allowance", 
        "IRIS: Payment 3.50 EUR - Metro ticket",
        "Alpha Bank: Purchase 25.00 EUR at TAVERNA ZORBA",
        "Piraeus: -45.00 EUR at SUPERMARKET AB",
        "Revolut: Spent 12.30 EUR at McDONALD'S",
        "PayPal: Payment 89.99 EUR to AMAZON"
    ]
    
    stats = sms_parser.get_parsing_stats(sample_messages)
    
    return {
        "parser_capabilities": {
            "supported_banks": list(sms_parser.BANK_PATTERNS.keys()),
            "supported_categories": [category.value for category in TransactionCategory],
            "parsing_methods": ["bank_specific", "generic", "fallback"],
            "confidence_levels": {
                "high": "0.8-1.0 (Bank-specific patterns)",
                "medium": "0.6-0.8 (Generic patterns)", 
                "low": "0.4-0.6 (Fallback patterns)"
            }
        },
        "sample_parsing_stats": stats,
        "recommendations": {
            "high_confidence_threshold": 0.8,
            "manual_review_threshold": 0.6,
            "supported_currencies": ["EUR"],
            "best_practices": [
                "Forward complete SMS messages",
                "Include bank name in the message",
                "Ensure amount and currency are clearly visible",
                "Include merchant/location information"
            ]
        }
    }

@router.get("/test-patterns")
async def test_sms_patterns():
    """Test endpoint to show SMS parsing patterns (for development)"""
    sample_sms = {
        "NBG Debit": "NBG: Αγορά 15.50 EUR στο COFFEE ISLAND ATHENS",
        "Eurobank Credit": "Eurobank: Πίστωση 200.00 EUR - Monthly allowance",
        "IRIS Payment": "IRIS: Payment 3.50 EUR - Metro ticket", 
        "Alpha Purchase": "Alpha Bank: Purchase 25.00 EUR at TAVERNA ZORBA",
        "Piraeus Debit": "Piraeus: -45.00 EUR at SUPERMARKET AB",
        "Revolut Spent": "Revolut: Spent 12.30 EUR at McDONALD'S",
        "PayPal Payment": "PayPal: Payment 89.99 EUR to AMAZON",
        "Generic Pattern": "Purchase 23.45 EUR at LOCAL SHOP",
        "Fallback Pattern": "Transaction: 67.89 EUR"
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
                "confidence": parsed.confidence,
                "parsing_method": parsed.parsing_method,
                "bank": parsed.bank,
                "merchant": parsed.merchant,
                "errors": parsed.errors
            }
        else:
            results[bank] = "Could not parse"
    
    return results