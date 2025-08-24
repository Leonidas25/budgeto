from fastapi import APIRouter, Request, HTTPException, Depends, status
from sqlmodel import Session, select
from app.db.database import get_session
from app.core.deps import get_current_active_user
from app.models import User
from app.services.telegram_bot import get_bot
from app.core.config import settings
import logging

router = APIRouter()

logger = logging.getLogger(__name__)

@router.post("/webhook")
async def telegram_webhook(request: Request):
    """Handle Telegram webhook updates"""
    try:
        bot = get_bot()
        if not bot:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Telegram bot not configured"
            )
        
        # Get the raw update data
        update_data = await request.json()
        
        # Process the update
        from telegram import Update
        update = Update.de_json(update_data, bot.app.bot)
        
        # Queue the update for processing
        await bot.app.process_update(update)
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Error processing Telegram webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process webhook"
        )

@router.post("/set-webhook")
async def set_telegram_webhook(
    current_user: User = Depends(get_current_active_user)
):
    """Set up Telegram webhook (admin only)"""
    if not settings.TELEGRAM_WEBHOOK_URL:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="TELEGRAM_WEBHOOK_URL not configured"
        )
    
    try:
        bot = get_bot()
        if not bot:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Telegram bot not configured"
            )
        
        await bot.app.bot.set_webhook(url=settings.TELEGRAM_WEBHOOK_URL)
        
        return {
            "status": "success",
            "webhook_url": settings.TELEGRAM_WEBHOOK_URL,
            "message": "Webhook set successfully"
        }
        
    except Exception as e:
        logger.error(f"Error setting webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to set webhook: {str(e)}"
        )

@router.delete("/webhook")
async def delete_telegram_webhook(
    current_user: User = Depends(get_current_active_user)
):
    """Delete Telegram webhook (admin only)"""
    try:
        bot = get_bot()
        if not bot:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Telegram bot not configured"
            )
        
        await bot.app.bot.delete_webhook()
        
        return {
            "status": "success",
            "message": "Webhook deleted successfully"
        }
        
    except Exception as e:
        logger.error(f"Error deleting webhook: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete webhook: {str(e)}"
        )

@router.get("/info")
async def get_bot_info(
    current_user: User = Depends(get_current_active_user)
):
    """Get bot information"""
    try:
        bot = get_bot()
        if not bot:
            return {
                "status": "disabled",
                "message": "Telegram bot not configured"
            }
        
        me = await bot.app.bot.get_me()
        webhook_info = await bot.app.bot.get_webhook_info()
        
        return {
            "status": "active",
            "bot_info": {
                "id": me.id,
                "username": me.username,
                "first_name": me.first_name,
                "can_join_groups": me.can_join_groups,
                "can_read_all_group_messages": me.can_read_all_group_messages,
                "supports_inline_queries": me.supports_inline_queries
            },
            "webhook_info": {
                "url": webhook_info.url,
                "has_custom_certificate": webhook_info.has_custom_certificate,
                "pending_update_count": webhook_info.pending_update_count,
                "last_error_date": webhook_info.last_error_date,
                "last_error_message": webhook_info.last_error_message,
                "max_connections": webhook_info.max_connections,
                "allowed_updates": webhook_info.allowed_updates
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting bot info: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get bot info: {str(e)}"
        )

@router.get("/my-telegram")
async def get_my_telegram_status(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user's Telegram link status"""
    return {
        "is_linked": bool(current_user.telegram_id),
        "telegram_id": current_user.telegram_id,
        "instructions": {
            "step_1": f"Start a chat with the bot",
            "step_2": f"Use /link {current_user.id} to connect your account",
            "step_3": "Start adding transactions with natural language!"
        }
    }

@router.post("/unlink")
async def unlink_telegram(
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Unlink Telegram account"""
    if not current_user.telegram_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No Telegram account linked"
        )
    
    try:
        current_user.telegram_id = None
        session.add(current_user)
        session.commit()
        
        return {
            "status": "success",
            "message": "Telegram account unlinked successfully"
        }
        
    except Exception as e:
        logger.error(f"Error unlinking Telegram: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unlink Telegram account"
        )

@router.post("/send-message/{user_id}")
async def send_message_to_user(
    user_id: int,
    message: str,
    current_user: User = Depends(get_current_active_user),
    session: Session = Depends(get_session)
):
    """Send a message to a specific user via Telegram (admin only)"""
    # For now, only allow users to send to themselves
    if user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only send messages to yourself"
        )
    
    try:
        statement = select(User).where(User.id == user_id)
        target_user = session.exec(statement).first()
        
        if not target_user or not target_user.telegram_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found or no Telegram linked"
            )
        
        bot = get_bot()
        if not bot:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Telegram bot not configured"
            )
        
        await bot.app.bot.send_message(
            chat_id=int(target_user.telegram_id),
            text=message,
            parse_mode='Markdown'
        )
        
        return {
            "status": "success",
            "message": "Message sent successfully"
        }
        
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )