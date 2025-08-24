import pytest
import asyncio
from typing import Generator
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session, create_engine
from sqlmodel.pool import StaticPool

from main import app
from app.db.database import get_session
from app.models import User, UserCreate
from app.core.auth import get_password_hash

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

def get_session_override():
    with Session(engine) as session:
        yield session

app.dependency_overrides[get_session] = get_session_override

@pytest.fixture(name="session")
def session_fixture():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session
    SQLModel.metadata.drop_all(engine)

@pytest.fixture(name="client")
def client_fixture(session: Session):
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()

@pytest.fixture(name="test_user")
def test_user_fixture(session: Session):
    """Create a test user"""
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "Test User",
        "password_hash": get_password_hash("testpassword123"),
        "archetype": "Allowance",
        "is_active": True
    }
    
    user = User(**user_data)
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

@pytest.fixture(name="auth_headers")
def auth_headers_fixture(client: TestClient, test_user: User):
    """Get authentication headers for test user"""
    response = client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "testpassword123"}
    )
    assert response.status_code == 200
    token_data = response.json()
    token = token_data["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(name="admin_user")
def admin_user_fixture(session: Session):
    """Create an admin test user"""
    admin_data = {
        "username": "admin",
        "email": "admin@example.com", 
        "full_name": "Admin User",
        "password_hash": get_password_hash("adminpassword123"),
        "archetype": "Saver",
        "is_active": True,
        "is_superuser": True
    }
    
    admin = User(**admin_data)
    session.add(admin)
    session.commit()
    session.refresh(admin)
    return admin

@pytest.fixture(name="admin_headers")
def admin_headers_fixture(client: TestClient, admin_user: User):
    """Get authentication headers for admin user"""
    response = client.post(
        "/api/auth/login",
        data={"username": "admin", "password": "adminpassword123"}
    )
    assert response.status_code == 200
    token_data = response.json()
    token = token_data["access_token"]
    return {"Authorization": f"Bearer {token}"}

# Utility functions for tests
def create_test_transaction(session: Session, user: User, **kwargs):
    """Helper to create test transactions"""
    from app.models import Transaction
    from app.models.enums import TransactionType, TransactionCategory, TransactionSource, TransactionState
    from decimal import Decimal
    from datetime import datetime
    
    default_data = {
        "user_id": user.id,
        "amount": Decimal("25.50"),
        "type": TransactionType.EXPENSE,
        "category": TransactionCategory.FOOD,
        "description": "Test transaction",
        "source": TransactionSource.MANUAL,
        "state": TransactionState.PENDING,
        "timestamp": datetime.utcnow()
    }
    
    default_data.update(kwargs)
    transaction = Transaction(**default_data)
    session.add(transaction)
    session.commit()
    session.refresh(transaction)
    return transaction

def create_test_budget(session: Session, user: User, **kwargs):
    """Helper to create test budgets"""
    from app.models import Budget
    from app.models.enums import BudgetType
    from decimal import Decimal
    from datetime import date
    
    default_data = {
        "user_id": user.id,
        "type": BudgetType.MONTHLY,
        "name": "Test Budget",
        "target_amount": Decimal("500.00"),
        "current_amount": Decimal("0.00"),
        "start_date": date.today(),
        "is_active": True
    }
    
    default_data.update(kwargs)
    budget = Budget(**default_data)
    session.add(budget)
    session.commit()
    session.refresh(budget)
    return budget