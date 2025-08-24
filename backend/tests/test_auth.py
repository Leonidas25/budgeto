import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models import User


class TestAuthAPI:
    """Test suite for authentication endpoints"""

    def test_register_success(self, client: TestClient, session: Session):
        """Test successful user registration"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "full_name": "New User",
            "password": "password123",
            "archetype": "Jobber"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 201
        data = response.json()
        assert data["username"] == "newuser"
        assert data["email"] == "newuser@example.com"
        assert data["full_name"] == "New User"
        assert data["archetype"] == "Jobber"
        assert "password" not in data
        assert "id" in data

    def test_register_duplicate_username(self, client: TestClient, test_user: User):
        """Test registration with duplicate username"""
        user_data = {
            "username": "testuser",  # Same as test_user
            "email": "different@example.com",
            "full_name": "Different User",
            "password": "password123",
            "archetype": "Saver"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_register_duplicate_email(self, client: TestClient, test_user: User):
        """Test registration with duplicate email"""
        user_data = {
            "username": "differentuser",
            "email": "test@example.com",  # Same as test_user
            "full_name": "Different User", 
            "password": "password123",
            "archetype": "Traveler"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()

    def test_register_invalid_archetype(self, client: TestClient):
        """Test registration with invalid archetype"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "full_name": "New User",
            "password": "password123",
            "archetype": "InvalidArchetype"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 422  # Validation error

    def test_register_weak_password(self, client: TestClient):
        """Test registration with weak password"""
        user_data = {
            "username": "newuser",
            "email": "newuser@example.com", 
            "full_name": "New User",
            "password": "123",  # Too short
            "archetype": "Allowance"
        }
        
        response = client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 422

    def test_login_success(self, client: TestClient, test_user: User):
        """Test successful login"""
        response = client.post(
            "/api/auth/login",
            data={"username": "testuser", "password": "testpassword123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data
        assert data["token_type"] == "bearer"

    def test_login_wrong_password(self, client: TestClient, test_user: User):
        """Test login with wrong password"""
        response = client.post(
            "/api/auth/login",
            data={"username": "testuser", "password": "wrongpassword"}
        )
        
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with nonexistent user"""
        response = client.post(
            "/api/auth/login",
            data={"username": "nonexistent", "password": "password123"}
        )
        
        assert response.status_code == 401

    def test_login_inactive_user(self, client: TestClient, session: Session):
        """Test login with inactive user"""
        # Create inactive user
        from app.core.auth import get_password_hash
        
        inactive_user = User(
            username="inactive",
            email="inactive@example.com",
            full_name="Inactive User",
            password_hash=get_password_hash("password123"),
            archetype="Allowance",
            is_active=False
        )
        session.add(inactive_user)
        session.commit()
        
        response = client.post(
            "/api/auth/login",
            data={"username": "inactive", "password": "password123"}
        )
        
        assert response.status_code == 401
        assert "inactive" in response.json()["detail"].lower()

    def test_get_current_user_success(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test getting current user profile"""
        response = client.get("/api/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == test_user.id
        assert data["username"] == test_user.username
        assert data["email"] == test_user.email
        assert data["full_name"] == test_user.full_name
        assert data["archetype"] == test_user.archetype

    def test_get_current_user_unauthorized(self, client: TestClient):
        """Test getting current user without auth"""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 401

    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 401

    def test_update_profile_success(self, client: TestClient, auth_headers: dict):
        """Test updating user profile"""
        update_data = {
            "full_name": "Updated Full Name",
            "email": "updated@example.com"
        }
        
        response = client.put("/api/auth/profile", json=update_data, headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["full_name"] == "Updated Full Name"
        assert data["email"] == "updated@example.com"

    def test_update_profile_duplicate_email(self, client: TestClient, auth_headers: dict, session: Session):
        """Test updating profile with duplicate email"""
        # Create another user with an email
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
        
        update_data = {
            "email": "other@example.com"  # Try to use other user's email
        }
        
        response = client.put("/api/auth/profile", json=update_data, headers=auth_headers)
        
        assert response.status_code == 400

    def test_change_password_success(self, client: TestClient, auth_headers: dict):
        """Test changing password successfully"""
        password_data = {
            "current_password": "testpassword123",
            "new_password": "newpassword123"
        }
        
        response = client.post("/api/auth/change-password", json=password_data, headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["message"] == "Password changed successfully"

    def test_change_password_wrong_current(self, client: TestClient, auth_headers: dict):
        """Test changing password with wrong current password"""
        password_data = {
            "current_password": "wrongpassword",
            "new_password": "newpassword123"
        }
        
        response = client.post("/api/auth/change-password", json=password_data, headers=auth_headers)
        
        assert response.status_code == 400
        assert "current password" in response.json()["detail"].lower()

    def test_change_password_weak_new(self, client: TestClient, auth_headers: dict):
        """Test changing password to weak password"""
        password_data = {
            "current_password": "testpassword123",
            "new_password": "123"  # Too weak
        }
        
        response = client.post("/api/auth/change-password", json=password_data, headers=auth_headers)
        
        assert response.status_code == 422

    def test_change_password_unauthorized(self, client: TestClient):
        """Test changing password without auth"""
        password_data = {
            "current_password": "testpassword123",
            "new_password": "newpassword123"
        }
        
        response = client.post("/api/auth/change-password", json=password_data)
        
        assert response.status_code == 401

    def test_delete_account_success(self, client: TestClient, auth_headers: dict, session: Session):
        """Test deleting user account"""
        response = client.delete("/api/auth/account", headers=auth_headers)
        
        assert response.status_code == 200
        assert response.json()["message"] == "Account deleted successfully"

    def test_delete_account_unauthorized(self, client: TestClient):
        """Test deleting account without auth"""
        response = client.delete("/api/auth/account")
        
        assert response.status_code == 401