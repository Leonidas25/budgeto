import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session
from decimal import Decimal
from datetime import date, datetime

from app.models import User, Budget
from app.models.enums import BudgetType
from tests.conftest import create_test_budget, create_test_transaction


class TestBudgetsAPI:
    """Test suite for budgets endpoints"""

    def test_create_budget_success(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test creating a budget successfully"""
        budget_data = {
            "type": "Monthly",
            "name": "Groceries Budget",
            "target_amount": 300.00,
            "start_date": date.today().isoformat(),
            "end_date": None
        }
        
        response = client.post("/api/budgets", json=budget_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Groceries Budget"
        assert data["target_amount"] == "300.00"
        assert data["type"] == "Monthly"
        assert data["user_id"] == test_user.id
        assert data["is_active"] == True

    def test_create_budget_goal_with_deadline(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test creating a goal budget with deadline"""
        end_date = date.today().replace(month=12, day=31)
        budget_data = {
            "type": "Goal",
            "name": "Vacation Fund",
            "target_amount": 1000.00,
            "start_date": date.today().isoformat(),
            "end_date": end_date.isoformat()
        }
        
        response = client.post("/api/budgets", json=budget_data, headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        assert data["type"] == "Goal"
        assert data["end_date"] == end_date.isoformat()

    def test_create_budget_missing_required_field(self, client: TestClient, auth_headers: dict):
        """Test creating budget without required fields"""
        budget_data = {
            "type": "Monthly",
            # Missing name and target_amount
        }
        
        response = client.post("/api/budgets", json=budget_data, headers=auth_headers)
        
        assert response.status_code == 422

    def test_create_budget_invalid_amount(self, client: TestClient, auth_headers: dict):
        """Test creating budget with invalid amount"""
        budget_data = {
            "type": "Monthly",
            "name": "Test Budget",
            "target_amount": -100.00,  # Negative amount
            "start_date": date.today().isoformat()
        }
        
        response = client.post("/api/budgets", json=budget_data, headers=auth_headers)
        
        assert response.status_code == 422

    def test_create_budget_unauthorized(self, client: TestClient):
        """Test creating budget without authentication"""
        budget_data = {
            "type": "Monthly",
            "name": "Test Budget",
            "target_amount": 300.00,
            "start_date": date.today().isoformat()
        }
        
        response = client.post("/api/budgets", json=budget_data)
        
        assert response.status_code == 401

    def test_get_budgets_success(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test getting user's budgets"""
        # Create test budgets
        create_test_budget(session, test_user, name="Budget 1")
        create_test_budget(session, test_user, name="Budget 2", is_active=False)
        
        response = client.get("/api/budgets", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1  # Only active budget by default
        assert all(b["user_id"] == test_user.id for b in data)
        assert all(b["is_active"] == True for b in data)

    def test_get_budgets_include_inactive(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test getting all budgets including inactive"""
        create_test_budget(session, test_user, name="Active Budget")
        create_test_budget(session, test_user, name="Inactive Budget", is_active=False)
        
        response = client.get("/api/budgets?active_only=false", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_get_budgets_unauthorized(self, client: TestClient):
        """Test getting budgets without authentication"""
        response = client.get("/api/budgets")
        
        assert response.status_code == 401

    def test_get_budget_progress_success(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test getting budget progress"""
        from app.models.enums import TransactionState, TransactionType, TransactionCategory
        
        # Create budget
        budget = create_test_budget(session, test_user, target_amount=Decimal("500.00"))
        
        # Create transactions that should count towards budget
        create_test_transaction(
            session, test_user,
            amount=Decimal("50.00"),
            type=TransactionType.EXPENSE,
            category=TransactionCategory.FOOD,
            state=TransactionState.APPROVED,
            timestamp=datetime.utcnow()
        )
        
        response = client.get(f"/api/budgets/{budget.id}/progress", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "spent_amount" in data
        assert "remaining_amount" in data
        assert "progress_percentage" in data
        assert "is_over_budget" in data
        assert "days_remaining" in data

    def test_get_budget_progress_not_found(self, client: TestClient, auth_headers: dict):
        """Test getting progress for non-existent budget"""
        response = client.get("/api/budgets/99999/progress", headers=auth_headers)
        
        assert response.status_code == 404

    def test_get_budget_progress_not_owned(self, client: TestClient, session: Session, test_user: User):
        """Test getting progress for budget owned by another user"""
        from app.core.auth import get_password_hash
        
        # Create another user and their budget
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
        
        budget = create_test_budget(session, other_user)
        
        # Try to access with test_user's auth
        login_response = TestClient(app).post(
            "/api/auth/login",
            data={"username": "testuser", "password": "testpassword123"}
        )
        token = login_response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = TestClient(app).get(f"/api/budgets/{budget.id}/progress", headers=headers)
        
        assert response.status_code == 404

    def test_update_budget_success(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test updating a budget"""
        budget = create_test_budget(session, test_user, name="Original Name")
        
        update_data = {
            "name": "Updated Name",
            "target_amount": 600.00,
            "is_active": False
        }
        
        response = client.put(f"/api/budgets/{budget.id}", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["target_amount"] == "600.00"
        assert data["is_active"] == False

    def test_update_budget_not_found(self, client: TestClient, auth_headers: dict):
        """Test updating non-existent budget"""
        update_data = {"name": "Updated"}
        
        response = client.put("/api/budgets/99999", json=update_data, headers=auth_headers)
        
        assert response.status_code == 404

    def test_update_budget_invalid_data(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test updating budget with invalid data"""
        budget = create_test_budget(session, test_user)
        
        update_data = {
            "target_amount": -100.00  # Invalid negative amount
        }
        
        response = client.put(f"/api/budgets/{budget.id}", json=update_data, headers=auth_headers)
        
        assert response.status_code == 422

    def test_delete_budget_success(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test deleting a budget"""
        budget = create_test_budget(session, test_user)
        
        response = client.delete(f"/api/budgets/{budget.id}", headers=auth_headers)
        
        assert response.status_code == 204

    def test_delete_budget_not_found(self, client: TestClient, auth_headers: dict):
        """Test deleting non-existent budget"""
        response = client.delete("/api/budgets/99999", headers=auth_headers)
        
        assert response.status_code == 404

    def test_budget_progress_calculation_accuracy(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test accuracy of budget progress calculation"""
        from app.models.enums import TransactionState, TransactionType, TransactionCategory
        from datetime import datetime, timedelta
        
        # Create monthly budget for current month
        budget = create_test_budget(
            session, test_user,
            type=BudgetType.MONTHLY,
            target_amount=Decimal("500.00"),
            start_date=date.today().replace(day=1)
        )
        
        # Create transactions for current month
        current_month = datetime.utcnow()
        
        # Approved expense transaction (should count)
        create_test_transaction(
            session, test_user,
            amount=Decimal("100.00"),
            type=TransactionType.EXPENSE,
            state=TransactionState.APPROVED,
            timestamp=current_month
        )
        
        # Pending expense transaction (should not count)
        create_test_transaction(
            session, test_user,
            amount=Decimal("50.00"),
            type=TransactionType.EXPENSE,
            state=TransactionState.PENDING,
            timestamp=current_month
        )
        
        # Income transaction (should not count towards budget)
        create_test_transaction(
            session, test_user,
            amount=Decimal("200.00"),
            type=TransactionType.INCOME,
            state=TransactionState.APPROVED,
            timestamp=current_month
        )
        
        # Transaction from previous month (should not count)
        last_month = current_month - timedelta(days=32)
        create_test_transaction(
            session, test_user,
            amount=Decimal("75.00"),
            type=TransactionType.EXPENSE,
            state=TransactionState.APPROVED,
            timestamp=last_month
        )
        
        response = client.get(f"/api/budgets/{budget.id}/progress", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Only the approved expense from current month should count
        assert float(data["spent_amount"]) == 100.00
        assert float(data["remaining_amount"]) == 400.00
        assert data["progress_percentage"] == 20.0  # 100/500 * 100
        assert data["is_over_budget"] == False

    def test_budget_over_spending(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test budget when user has overspent"""
        from app.models.enums import TransactionState, TransactionType
        
        # Create budget with low target
        budget = create_test_budget(session, test_user, target_amount=Decimal("100.00"))
        
        # Create expense that exceeds budget
        create_test_transaction(
            session, test_user,
            amount=Decimal("150.00"),
            type=TransactionType.EXPENSE,
            state=TransactionState.APPROVED
        )
        
        response = client.get(f"/api/budgets/{budget.id}/progress", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert float(data["spent_amount"]) == 150.00
        assert float(data["remaining_amount"]) == -50.00  # Negative remaining
        assert data["progress_percentage"] == 150.0  # Over 100%
        assert data["is_over_budget"] == True