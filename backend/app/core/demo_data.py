"""
Demo data initialization for Budgeto
Creates sample users and data for testing and development
"""

from sqlmodel import Session, select
from app.models import User, UserGamification
from app.core.auth import get_password_hash
from app.db.database import get_session
import logging

logger = logging.getLogger(__name__)

def create_demo_users(session: Session):
    """Create demo users for testing"""
    
    # Demo student user
    demo_username = "demo_student"
    demo_password = "demo123"  # Simple password for demo
    
    # Check if demo user already exists
    statement = select(User).where(User.username == demo_username)
    existing_user = session.exec(statement).first()
    
    if not existing_user:
        # Create demo student user
        demo_user = User(
            username=demo_username,
            email="demo@student.gr",
            full_name="Demo Student",
            archetype="Allowance",  # Valid enum value for students
            hashed_password=get_password_hash(demo_password),
            is_active=True
        )
        
        session.add(demo_user)
        session.commit()
        session.refresh(demo_user)
        
        # Create gamification profile
        gamification = UserGamification(
            user_id=demo_user.id,
            xp=250,  # Give some initial XP
            level=2,
            streak_count=3,  # Using correct column name
            total_transactions_approved=10,
            total_budgets_met=2
        )
        session.add(gamification)
        session.commit()
        
        logger.info(f"Created demo user: {demo_username} with password: {demo_password}")
        print(f"✅ Created demo user: {demo_username} (password: {demo_password})")
    else:
        logger.info(f"Demo user {demo_username} already exists")
        print(f"ℹ️  Demo user {demo_username} already exists")

def initialize_demo_data():
    """Initialize all demo data"""
    try:
        # Get database session
        session_generator = get_session()
        session = next(session_generator)
        
        print("🔧 Initializing demo data...")
        create_demo_users(session)
        print("✅ Demo data initialization complete!")
        
    except Exception as e:
        logger.error(f"Failed to initialize demo data: {e}")
        print(f"❌ Failed to initialize demo data: {e}")
    finally:
        if 'session' in locals():
            session.close()