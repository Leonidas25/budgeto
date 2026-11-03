from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlmodel import Session, select
from datetime import timedelta
from app.models import User, UserCreate, UserRead, UserGamification
from app.db.database import get_session
from app.core.auth import verify_password, get_password_hash, create_access_token
from app.core.deps import get_current_active_user
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, session: Session = Depends(get_session)):
    """Register a new user"""
    # Check if username already exists
    statement = select(User).where(User.username == user_data.username)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Check if email already exists
    statement = select(User).where(User.email == user_data.email)
    existing_email = session.exec(statement).first()
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    db_user = User(
        username=user_data.username,
        email=user_data.email,
        full_name=user_data.full_name,
        archetype=user_data.archetype,
        telegram_id=user_data.telegram_id,
        hashed_password=hashed_password
    )
    
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    # Create gamification profile
    gamification = UserGamification(user_id=db_user.id)
    session.add(gamification)
    session.commit()
    
    return db_user

@router.post("/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), session: Session = Depends(get_session)):
    """Login user and return access token"""
    # Authenticate user
    statement = select(User).where(User.username == form_data.username)
    user = session.exec(statement).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserRead.from_orm(user)
    }

@router.get("/me", response_model=UserRead)
async def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    return current_user

@router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_active_user)):
    """Refresh access token"""
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.username}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }