from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from sqlmodel import SQLModel, create_engine, Session
from contextlib import asynccontextmanager
import os
from dotenv import load_dotenv

from app.core.config import settings
from app.core.demo_data import initialize_demo_data
from app.api.auth import router as auth_router
from app.api.transactions import router as transactions_router
from app.api.budgets import router as budgets_router
from app.api.gamification import router as gamification_router
from app.api.sms import router as sms_router
from app.api.telegram import router as telegram_router
from app.api.achievements import router as achievements_router
from app.db.database import create_db_and_tables, get_session

load_dotenv()

# Database setup
engine = create_engine(settings.DATABASE_URL, echo=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup
    create_db_and_tables()
    
    # Initialize demo data
    initialize_demo_data()
    
    yield

# FastAPI app
app = FastAPI(
    title="Budgeto API",
    description="Student Finance App for Greece - Backend API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:3001", 
        "http://127.0.0.1:3000", 
        "http://127.0.0.1:3001"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(transactions_router, prefix="/api/transactions", tags=["Transactions"])
app.include_router(budgets_router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(gamification_router, prefix="/api/gamification", tags=["Gamification"])
app.include_router(sms_router, prefix="/api/sms", tags=["SMS Processing"])
app.include_router(telegram_router, prefix="/api/telegram", tags=["Telegram Bot"])
app.include_router(achievements_router, prefix="/api/achievements", tags=["Achievements"])

@app.get("/")
async def root():
    return {"message": "Budgeto API - Student Finance App for Greece 🇬🇷"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)