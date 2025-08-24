"""
Budgeto Telegram Bot Integration
Provides natural language transaction entry and basic commands for Greek students
"""

import logging
import re
from typing import Optional, Dict, Any
from datetime import datetime

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import (
    Application, CommandHandler, MessageHandler, 
    CallbackQueryHandler, ContextTypes, filters
)

from app.core.config import settings
from app.db.database import get_session
from app.models import User, Transaction, TransactionCreate
from app.models.enums import TransactionType, TransactionSource, TransactionState, TransactionCategory
from app.api.gamification import award_xp_internal
from app.services.categorization import CategorizationEngine

# Set up logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

class BudgetoBot:
    def __init__(self, token: str):
        self.token = token
        self.app = Application.builder().token(token).build()
        self.categorization_engine = CategorizationEngine()
        self.setup_handlers()
    
    def setup_handlers(self):
        """Set up bot command and message handlers"""
        # Commands
        self.app.add_handler(CommandHandler("start", self.start))
        self.app.add_handler(CommandHandler("help", self.help_command))
        self.app.add_handler(CommandHandler("link", self.link_account))
        self.app.add_handler(CommandHandler("add", self.add_transaction))
        self.app.add_handler(CommandHandler("budget", self.check_budget))
        self.app.add_handler(CommandHandler("stats", self.check_stats))
        self.app.add_handler(CommandHandler("today", self.today_summary))
        
        # Natural language message handler
        self.app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, self.handle_message))
        
        # Callback query handler for inline keyboards
        self.app.add_handler(CallbackQueryHandler(self.handle_callback))
    
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        user_id = update.effective_user.id
        username = update.effective_user.username
        first_name = update.effective_user.first_name
        
        # Check if user is already linked
        with get_session() as session:
            user = session.query(User).filter(User.telegram_id == str(user_id)).first()
            
            if user:
                welcome_msg = f"🎉 Καλώς ήρθες πίσω, {first_name}!\n\n"
                welcome_msg += "I'm your personal finance assistant! Here's what I can do:\n\n"
                welcome_msg += "💰 **Add transactions:**\n"
                welcome_msg += "• `Coffee 3.50` - Quick expense\n"
                welcome_msg += "• `/add Lunch 12 euros` - Formatted command\n"
                welcome_msg += "• `Income allowance 300` - Track income\n\n"
                welcome_msg += "📊 **Check your stats:**\n"
                welcome_msg += "• `/budget` - Monthly budget progress\n"
                welcome_msg += "• `/stats` - Level, XP, and achievements\n"
                welcome_msg += "• `/today` - Today's spending summary\n\n"
                welcome_msg += "🇬🇷 *Speak naturally in Greek or English!*"
            else:
                welcome_msg = f"🎉 Γεια σου {first_name}! Welcome to Budgeto!\n\n"
                welcome_msg += "I'm your AI-powered finance assistant for Greek students! 🇬🇷\n\n"
                welcome_msg += "To get started, you need to link your Telegram account to your Budgeto profile:\n\n"
                welcome_msg += "1️⃣ **Create an account** at [budgeto.app](https://budgeto.app)\n"
                welcome_msg += "2️⃣ **Get your user ID** from Settings\n"
                welcome_msg += "3️⃣ **Use** `/link YOUR_USER_ID` here\n\n"
                welcome_msg += "💡 *Pro tip: You can start adding transactions right away with natural language!*\n"
                welcome_msg += "Example: `Coffee at Starbucks 4.50` or `Μεσημεριανό 15 ευρώ`"
        
        await update.message.reply_text(welcome_msg, parse_mode='Markdown')
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command"""
        help_text = "🤖 **Budgeto Bot Commands**\n\n"
        help_text += "**Account Management:**\n"
        help_text += "• `/start` - Welcome & setup guide\n"
        help_text += "• `/link USER_ID` - Link Telegram to your account\n\n"
        help_text += "**Add Transactions:**\n"
        help_text += "• `/add Coffee 3.50` - Add expense\n"
        help_text += "• `Lunch 12 euros` - Natural language\n"
        help_text += "• `Income part-time 200` - Track income\n\n"
        help_text += "**Check Status:**\n"
        help_text += "• `/budget` - Monthly budget progress\n"
        help_text += "• `/stats` - XP, level & achievements\n"
        help_text += "• `/today` - Today's transactions\n\n"
        help_text += "**Natural Language Examples:**\n"
        help_text += "• `Φαγητό στην ταβέρνα 18 ευρώ`\n"
        help_text += "• `Transport metro 1.40`\n"
        help_text += "• `Coffee with friends 12`\n"
        help_text += "• `Groceries Sklavenitis 45.60`\n\n"
        help_text += "🇬🇷 *I understand Greek and English!*"
        
        await update.message.reply_text(help_text, parse_mode='Markdown')
    
    async def link_account(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle account linking"""
        if not context.args:
            await update.message.reply_text(
                "❌ Please provide your user ID from the Budgeto app.\n"
                "Usage: `/link YOUR_USER_ID`\n\n"
                "You can find your user ID in the app's Settings page."
            )
            return
        
        try:
            user_id_from_app = int(context.args[0])
            telegram_user_id = str(update.effective_user.id)
            
            with get_session() as session:
                # Find user by ID
                user = session.query(User).filter(User.id == user_id_from_app).first()
                
                if not user:
                    await update.message.reply_text(
                        f"❌ User ID {user_id_from_app} not found.\n"
                        "Please check your user ID in the Budgeto app settings."
                    )
                    return
                
                if user.telegram_id:
                    await update.message.reply_text(
                        "❌ This account is already linked to another Telegram user.\n"
                        "Contact support if this is an error."
                    )
                    return
                
                # Link the account
                user.telegram_id = telegram_user_id
                session.commit()
                
                # Award XP for linking account
                try:
                    await award_xp_internal(user.id, 'daily_login', session)
                except Exception as e:
                    logger.warning(f"Failed to award XP for account linking: {e}")
                
                await update.message.reply_text(
                    f"✅ **Account linked successfully!**\n\n"
                    f"🎉 Welcome {user.full_name}!\n"
                    f"Archetype: {user.archetype}\n\n"
                    f"You can now:\n"
                    f"💰 Add transactions with natural language\n"
                    f"📊 Check your stats with `/stats`\n"
                    f"🎯 Monitor your budget with `/budget`\n\n"
                    f"Try saying: `Coffee 3.50` or `Μεσημεριανό 15 ευρώ`"
                )
                
        except ValueError:
            await update.message.reply_text(
                "❌ Invalid user ID format. Please use a numeric ID from the app."
            )
        except Exception as e:
            logger.error(f"Error linking account: {e}")
            await update.message.reply_text(
                "❌ Failed to link account. Please try again later."
            )
    
    async def add_transaction(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /add command"""
        user = await self.get_linked_user(update)
        if not user:
            return
        
        if not context.args:
            await update.message.reply_text(
                "💡 **Usage examples:**\n"
                "• `/add Coffee 3.50`\n"
                "• `/add Lunch at taverna 15 euros`\n"
                "• `/add Income allowance 200`\n\n"
                "Or just type naturally: `Coffee 3.50`"
            )
            return
        
        text = " ".join(context.args)
        await self.process_transaction_text(update, user, text)
    
    async def handle_message(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle natural language messages"""
        user = await self.get_linked_user(update)
        if not user:
            return
        
        text = update.message.text
        await self.process_transaction_text(update, user, text)
    
    async def process_transaction_text(self, update: Update, user: User, text: str):
        """Process transaction from natural language text"""
        try:
            parsed = self.parse_natural_language(text)
            
            if not parsed:
                await update.message.reply_text(
                    "🤔 I couldn't understand that transaction.\n\n"
                    "Try formats like:\n"
                    "• `Coffee 3.50`\n"
                    "• `Lunch 15 euros`\n"
                    "• `Income part-time 200`\n"
                    "• `Φαγητό ταβέρνα 18 ευρώ`"
                )
                return
            
            # Get category suggestion
            suggestions = self.categorization_engine.suggest_category(
                description=parsed['description'],
                amount=parsed['amount'],
                transaction_type=parsed['type']
            )
            
            suggested_category = suggestions[0]['category'] if suggestions else 'Other'
            confidence = suggestions[0]['score'] if suggestions else 0.5
            
            # Create transaction
            with get_session() as session:
                transaction = Transaction(
                    user_id=user.id,
                    amount=parsed['amount'],
                    type=parsed['type'],
                    category=suggested_category,
                    description=parsed['description'],
                    source=TransactionSource.TELEGRAM,
                    state=TransactionState.PENDING
                )
                
                session.add(transaction)
                session.commit()
                session.refresh(transaction)
                
                # Award XP
                try:
                    await award_xp_internal(user.id, 'transaction_approved', session)
                except Exception as e:
                    logger.warning(f"Failed to award XP: {e}")
                
                # Create confirmation message
                emoji = "💰" if parsed['type'] == TransactionType.INCOME else "💸"
                confidence_emoji = "🎯" if confidence > 0.8 else "🤔" if confidence > 0.5 else "❓"
                
                message = f"{emoji} **Transaction Added!**\n\n"
                message += f"**Amount:** €{parsed['amount']:.2f}\n"
                message += f"**Type:** {parsed['type'].title()}\n"
                message += f"**Description:** {parsed['description']}\n"
                message += f"**Category:** {suggested_category} {confidence_emoji}\n"
                message += f"**Status:** Pending approval\n\n"
                
                if confidence < 0.7:
                    message += f"💡 *Category confidence: {confidence*100:.0f}%*\n"
                    message += f"You can edit this in the app if needed.\n\n"
                
                message += f"🎮 **+10 XP earned!**"
                
                # Add quick action buttons
                keyboard = [
                    [
                        InlineKeyboardButton("✅ Approve", callback_data=f"approve_{transaction.id}"),
                        InlineKeyboardButton("❌ Delete", callback_data=f"delete_{transaction.id}")
                    ],
                    [InlineKeyboardButton("📱 Open App", url="https://budgeto.app")]
                ]
                reply_markup = InlineKeyboardMarkup(keyboard)
                
                await update.message.reply_text(
                    message, 
                    parse_mode='Markdown',
                    reply_markup=reply_markup
                )
                
        except Exception as e:
            logger.error(f"Error processing transaction: {e}")
            await update.message.reply_text(
                "❌ Failed to add transaction. Please try again."
            )
    
    def parse_natural_language(self, text: str) -> Optional[Dict[str, Any]]:
        """Parse natural language transaction text"""
        text = text.lower().strip()
        
        # Determine transaction type
        income_keywords = ['income', 'allowance', 'salary', 'job', 'work', 'pocket money', 
                          'εισόδημα', 'χαρτζιλίκι', 'δουλειά', 'μισθός']
        
        transaction_type = TransactionType.INCOME if any(keyword in text for keyword in income_keywords) else TransactionType.EXPENSE
        
        # Extract amount - support both euro symbols and words
        amount_patterns = [
            r'(\d+[.,]\d+)\s*(?:€|eur|euro|euros|ευρώ)',
            r'(\d+)\s*(?:€|eur|euro|euros|ευρώ)',
            r'(\d+[.,]\d+)',
            r'(\d+)'
        ]
        
        amount = None
        for pattern in amount_patterns:
            match = re.search(pattern, text)
            if match:
                amount_str = match.group(1).replace(',', '.')
                try:
                    amount = float(amount_str)
                    break
                except ValueError:
                    continue
        
        if amount is None:
            return None
        
        # Extract description by removing amount and common words
        description = text
        # Remove amount mentions
        for pattern in amount_patterns:
            description = re.sub(pattern, '', description)
        
        # Remove euro mentions
        description = re.sub(r'\b(?:€|eur|euro|euros|ευρώ)\b', '', description)
        
        # Remove income keywords
        for keyword in income_keywords:
            description = description.replace(keyword, '')
        
        # Clean up description
        description = re.sub(r'\s+', ' ', description).strip()
        
        # If description is empty or too short, use a default
        if len(description) < 2:
            if transaction_type == TransactionType.INCOME:
                description = "Income via Telegram"
            else:
                description = "Expense via Telegram"
        else:
            description = description.title()
        
        return {
            'amount': amount,
            'type': transaction_type,
            'description': description
        }
    
    async def get_linked_user(self, update: Update) -> Optional[User]:
        """Get user linked to this Telegram account"""
        telegram_user_id = str(update.effective_user.id)
        
        with get_session() as session:
            user = session.query(User).filter(User.telegram_id == telegram_user_id).first()
            
            if not user:
                await update.message.reply_text(
                    "❌ **Account not linked**\n\n"
                    "Please link your Budgeto account first:\n"
                    "1️⃣ Create account at [budgeto.app](https://budgeto.app)\n"
                    "2️⃣ Get your user ID from Settings\n"
                    "3️⃣ Use `/link YOUR_USER_ID` here\n\n"
                    "Or use `/start` for detailed instructions.",
                    parse_mode='Markdown'
                )
                return None
            
            return user
    
    async def check_budget(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /budget command"""
        user = await self.get_linked_user(update)
        if not user:
            return
        
        # TODO: Implement budget checking logic with API call
        await update.message.reply_text(
            "📊 **Budget Check**\n\n"
            "This feature is coming soon! 🚧\n"
            "Check your budget in the [Budgeto app](https://budgeto.app) for now.",
            parse_mode='Markdown'
        )
    
    async def check_stats(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /stats command"""
        user = await self.get_linked_user(update)
        if not user:
            return
        
        # TODO: Implement stats checking logic with API call
        await update.message.reply_text(
            "🎮 **Your Stats**\n\n"
            "This feature is coming soon! 🚧\n"
            "Check your progress in the [Budgeto app](https://budgeto.app) for now.",
            parse_mode='Markdown'
        )
    
    async def today_summary(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /today command"""
        user = await self.get_linked_user(update)
        if not user:
            return
        
        # TODO: Implement today's summary logic with API call
        await update.message.reply_text(
            "📅 **Today's Summary**\n\n"
            "This feature is coming soon! 🚧\n"
            "Check today's transactions in the [Budgeto app](https://budgeto.app) for now.",
            parse_mode='Markdown'
        )
    
    async def handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle inline keyboard callbacks"""
        query = update.callback_query
        await query.answer()
        
        user = await self.get_linked_user_from_callback(query)
        if not user:
            return
        
        data = query.data
        
        if data.startswith("approve_"):
            transaction_id = int(data.split("_")[1])
            await self.approve_transaction(query, user, transaction_id)
        elif data.startswith("delete_"):
            transaction_id = int(data.split("_")[1])
            await self.delete_transaction(query, user, transaction_id)
    
    async def get_linked_user_from_callback(self, query) -> Optional[User]:
        """Get user from callback query"""
        telegram_user_id = str(query.from_user.id)
        
        with get_session() as session:
            user = session.query(User).filter(User.telegram_id == telegram_user_id).first()
            return user
    
    async def approve_transaction(self, query, user: User, transaction_id: int):
        """Approve a transaction"""
        try:
            with get_session() as session:
                transaction = session.query(Transaction).filter(
                    Transaction.id == transaction_id,
                    Transaction.user_id == user.id
                ).first()
                
                if not transaction:
                    await query.edit_message_text("❌ Transaction not found.")
                    return
                
                if transaction.state == TransactionState.APPROVED:
                    await query.edit_message_text("✅ Transaction already approved!")
                    return
                
                transaction.state = TransactionState.APPROVED
                session.commit()
                
                # Award additional XP for approval
                try:
                    await award_xp_internal(user.id, 'transaction_approved', session)
                except Exception as e:
                    logger.warning(f"Failed to award XP: {e}")
                
                emoji = "💰" if transaction.type == TransactionType.INCOME else "💸"
                message = f"{emoji} **Transaction Approved!**\n\n"
                message += f"€{transaction.amount:.2f} - {transaction.description}\n"
                message += f"Category: {transaction.category}\n\n"
                message += f"🎮 **+15 XP earned for approval!**"
                
                await query.edit_message_text(message, parse_mode='Markdown')
                
        except Exception as e:
            logger.error(f"Error approving transaction: {e}")
            await query.edit_message_text("❌ Failed to approve transaction.")
    
    async def delete_transaction(self, query, user: User, transaction_id: int):
        """Delete a transaction"""
        try:
            with get_session() as session:
                transaction = session.query(Transaction).filter(
                    Transaction.id == transaction_id,
                    Transaction.user_id == user.id
                ).first()
                
                if not transaction:
                    await query.edit_message_text("❌ Transaction not found.")
                    return
                
                session.delete(transaction)
                session.commit()
                
                await query.edit_message_text(
                    "🗑️ **Transaction Deleted**\n\n"
                    "The transaction has been removed from your records."
                )
                
        except Exception as e:
            logger.error(f"Error deleting transaction: {e}")
            await query.edit_message_text("❌ Failed to delete transaction.")
    
    async def run_webhook(self, webhook_url: str, port: int = 8443):
        """Run bot with webhook"""
        await self.app.bot.set_webhook(url=webhook_url)
        await self.app.run_webhook(
            listen="0.0.0.0",
            port=port,
            webhook_url=webhook_url
        )
    
    async def run_polling(self):
        """Run bot with polling (for development)"""
        await self.app.bot.delete_webhook()
        await self.app.run_polling()

# Initialize bot if token is available
bot_instance = None

def get_bot() -> Optional[BudgetoBot]:
    """Get bot instance"""
    global bot_instance
    if settings.TELEGRAM_BOT_TOKEN and not bot_instance:
        bot_instance = BudgetoBot(settings.TELEGRAM_BOT_TOKEN)
    return bot_instance

if __name__ == "__main__":
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.error("TELEGRAM_BOT_TOKEN not set in environment")
        exit(1)
    
    bot = BudgetoBot(settings.TELEGRAM_BOT_TOKEN)
    
    import asyncio
    if settings.TELEGRAM_WEBHOOK_URL:
        asyncio.run(bot.run_webhook(settings.TELEGRAM_WEBHOOK_URL))
    else:
        asyncio.run(bot.run_polling())