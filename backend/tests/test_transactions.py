import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session
from decimal import Decimal
from datetime import datetime

from app.models import User, Transaction
from app.models.enums import TransactionType, TransactionCategory, TransactionSource, TransactionState
from tests.conftest import create_test_transaction


class TestTransactionsAPI:
    """Test suite for transactions endpoints"""

    def test_create_transaction_success(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test creating a transaction successfully"""
        transaction_data = {
            "amount": 25.50,
            "type": "expense",
            "category": "Food",
            "description": "Coffee shop",
            "source": "Manual"
        }
        
        response = client.post("/api/transactions", json=transaction_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["amount"] == "25.50"
        assert data["type"] == "expense"
        assert data["category"] == "Food"
        assert data["description"] == "Coffee shop"
        assert data["source"] == "Manual"
        assert data["user_id"] == test_user.id

    def test_create_transaction_missing_required_field(self, client: TestClient, auth_headers: dict):
        """Test creating transaction without required fields"""
        transaction_data = {
            "type": "expense",
            "category": "Food",
            # Missing amount
        }
        
        response = client.post("/api/transactions", json=transaction_data, headers=auth_headers)
        
        assert response.status_code == 422

    def test_create_transaction_invalid_amount(self, client: TestClient, auth_headers: dict):
        """Test creating transaction with invalid amount"""
        transaction_data = {
            "amount": -10.00,  # Negative amount
            "type": "expense", 
            "category": "Food"
        }
        
        response = client.post("/api/transactions", json=transaction_data, headers=auth_headers)
        
        assert response.status_code == 422

    def test_create_transaction_unauthorized(self, client: TestClient):
        """Test creating transaction without authentication"""
        transaction_data = {
            "amount": 25.50,
            "type": "expense",
            "category": "Food"
        }
        
        response = client.post("/api/transactions", json=transaction_data)
        
        assert response.status_code == 401

    def test_get_transactions_success(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test getting user's transactions"""
        # Create test transactions
        create_test_transaction(session, test_user, amount=Decimal("15.00"), description="Transaction 1")
        create_test_transaction(session, test_user, amount=Decimal("25.00"), description="Transaction 2")
        
        response = client.get("/api/transactions", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
        assert all(t["user_id"] == test_user.id for t in data)

    def test_get_transactions_with_filters(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test getting transactions with filters"""
        # Create transactions with different states
        create_test_transaction(session, test_user, state=TransactionState.PENDING, description="Pending")
        create_test_transaction(session, test_user, state=TransactionState.APPROVED, description="Approved")
        
        # Test filtering by state
        response = client.get("/api/transactions?state=Pending", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["state"] == "Pending"

    def test_get_transactions_pagination(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test transaction pagination"""
        # Create multiple transactions
        for i in range(5):
            create_test_transaction(session, test_user, description=f"Transaction {i}")
        
        # Test pagination
        response = client.get("/api/transactions?skip=2&limit=2", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_get_pending_transactions(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test getting pending transactions"""
        create_test_transaction(session, test_user, state=TransactionState.PENDING)
        create_test_transaction(session, test_user, state=TransactionState.APPROVED)
        
        response = client.get("/api/transactions/pending", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["state"] == "Pending"

    def test_get_transaction_by_id_success(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test getting specific transaction by ID"""
        transaction = create_test_transaction(session, test_user, description="Test transaction")
        
        response = client.get(f"/api/transactions/{transaction.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == transaction.id
        assert data["description"] == "Test transaction"

    def test_get_transaction_not_found(self, client: TestClient, auth_headers: dict):
        """Test getting non-existent transaction"""
        response = client.get("/api/transactions/99999", headers=auth_headers)
        
        assert response.status_code == 404

    def test_get_transaction_not_owned(self, client: TestClient, session: Session, test_user: User):
        """Test getting transaction owned by another user"""
        # Create another user and their transaction
        from app.core.auth import get_password_hash
        
        other_user = User(
            username="otheruser",
            email="other@example.com", 
            full_name="Other User",
            password_hash=get_password_hash("password123"),
            archetype="Saver",
            is_active=True
        )
        session.add(other_user)
        session.commit()
        session.refresh(other_user)
        
        transaction = create_test_transaction(session, other_user)
        
        # Try to access with test_user's auth
        login_response = TestClient(app).post(
            "/api/auth/login",
            data={"username": "testuser", "password": "testpassword123"}
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = TestClient(app).get(f"/api/transactions/{transaction.id}", headers=headers)
        
        assert response.status_code == 404

    def test_update_transaction_success(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test updating a transaction"""
        transaction = create_test_transaction(session, test_user, description="Original description")
        
        update_data = {
            "description": "Updated description",
            "amount": 35.00,
            "category": "Drinks"
        }
        
        response = client.put(f"/api/transactions/{transaction.id}", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Updated description"
        assert data["amount"] == "35.00"
        assert data["category"] == "Drinks"

    def test_update_transaction_not_found(self, client: TestClient, auth_headers: dict):
        """Test updating non-existent transaction"""
        update_data = {"description": "Updated"}
        
        response = client.put("/api/transactions/99999", json=update_data, headers=auth_headers)
        
        assert response.status_code == 404

    def test_approve_transaction_success(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test approving a pending transaction"""
        transaction = create_test_transaction(session, test_user, state=TransactionState.PENDING)
        
        approval_data = {
            "category": "Food",
            "description": "Approved transaction"
        }
        
        response = client.post(f"/api/transactions/{transaction.id}/approve", json=approval_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["state"] == "Approved"
        assert data["category"] == "Food"
        assert data["description"] == "Approved transaction"
        assert data["approved_at"] is not None

    def test_approve_transaction_already_approved(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test approving already approved transaction"""
        transaction = create_test_transaction(session, test_user, state=TransactionState.APPROVED)
        
        response = client.post(f"/api/transactions/{transaction.id}/approve", headers=auth_headers)
        
        assert response.status_code == 404  # Not found because not pending

    def test_approve_transaction_not_found(self, client: TestClient, auth_headers: dict):
        """Test approving non-existent transaction"""
        response = client.post("/api/transactions/99999/approve", headers=auth_headers)
        
        assert response.status_code == 404

    def test_delete_transaction_success(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test deleting a transaction"""
        transaction = create_test_transaction(session, test_user)
        
        response = client.delete(f"/api/transactions/{transaction.id}", headers=auth_headers)
        
        assert response.status_code == 204

    def test_delete_transaction_not_found(self, client: TestClient, auth_headers: dict):
        """Test deleting non-existent transaction"""
        response = client.delete("/api/transactions/99999", headers=auth_headers)
        
        assert response.status_code == 404

    def test_suggest_category_success(self, client: TestClient, auth_headers: dict):
        """Test category suggestion endpoint"""
        suggestion_data = {
            "description": "Coffee Island Athens",
            "amount": 4.50,
            "transaction_type": "expense"
        }
        
        response = client.post("/api/transactions/suggest-category", json=suggestion_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "suggestions" in data
        assert len(data["suggestions"]) > 0
        
        # Check suggestion structure
        suggestion = data["suggestions"][0]
        assert "category" in suggestion
        assert "confidence" in suggestion
        assert "confidence_level" in suggestion

    def test_get_popular_categories(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test getting popular categories"""
        # Create transactions with different categories
        create_test_transaction(session, test_user, category=TransactionCategory.FOOD, state=TransactionState.APPROVED)
        create_test_transaction(session, test_user, category=TransactionCategory.FOOD, state=TransactionState.APPROVED)
        create_test_transaction(session, test_user, category=TransactionCategory.TRANSPORT, state=TransactionState.APPROVED)
        
        response = client.get("/api/transactions/categories/popular", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "popular_categories" in data
        
        # Food should be most popular (appears twice)
        if data["popular_categories"]:
            assert data["popular_categories"][0]["category"] == "Food"