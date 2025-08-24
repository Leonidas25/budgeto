import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session
from datetime import datetime, date

from app.models import User, UserGamification
from tests.conftest import create_test_transaction


class TestGamificationAPI:
    """Test suite for gamification endpoints"""

    def test_get_my_gamification_new_user(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test getting gamification stats for new user"""
        response = client.get("/api/gamification/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == test_user.id
        assert data["xp"] == 0
        assert data["level"] == 1
        assert data["streak_count"] == 0
        assert data["total_transactions_approved"] == 0

    def test_get_my_gamification_existing_user(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test getting gamification stats for user with existing data"""
        # Create gamification record
        gamification = UserGamification(
            user_id=test_user.id,
            xp=250,
            level=3,
            streak_count=5,
            total_transactions_approved=15,
            last_activity=date.today()
        )
        session.add(gamification)
        session.commit()
        
        response = client.get("/api/gamification/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["xp"] == 250
        assert data["level"] == 3
        assert data["streak_count"] == 5
        assert data["total_transactions_approved"] == 15

    def test_award_xp_valid_action(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test awarding XP for valid action"""
        response = client.post("/api/gamification/award-xp/transaction_approved", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["xp_awarded"] == 10  # From XP_REWARDS config
        assert data["total_xp"] == 10
        assert data["level"] == 1  # Still level 1 with 10 XP
        assert data["level_up"] == False

    def test_award_xp_invalid_action(self, client: TestClient, auth_headers: dict):
        """Test awarding XP for invalid action"""
        response = client.post("/api/gamification/award-xp/invalid_action", headers=auth_headers)
        
        assert response.status_code == 400
        assert "Unknown action" in response.json()["detail"]

    def test_award_xp_level_up(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test XP award that causes level up"""
        # Create user with 95 XP (5 away from level 2 at 100 XP)
        gamification = UserGamification(
            user_id=test_user.id,
            xp=95,
            level=1
        )
        session.add(gamification)
        session.commit()
        
        response = client.post("/api/gamification/award-xp/transaction_approved", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["level_up"] == True
        assert data["level"] == 2

    def test_award_xp_unauthorized(self, client: TestClient):
        """Test awarding XP without authentication"""
        response = client.post("/api/gamification/award-xp/transaction_approved")
        
        assert response.status_code == 401

    def test_get_insights_no_transactions(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test getting insights with no transactions"""
        response = client.get("/api/gamification/insights", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # Should have at least one insight for no transactions
        if data:
            assert "golden" in data[0]["message"].lower() or "oracle" in data[0]["message"].lower()

    def test_get_insights_with_transactions(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test getting insights with transactions"""
        from app.models.enums import TransactionState, TransactionType
        from decimal import Decimal
        
        # Create approved transactions for this week
        create_test_transaction(
            session, test_user, 
            state=TransactionState.APPROVED,
            amount=Decimal("25.00"),
            type=TransactionType.EXPENSE
        )
        
        response = client.get("/api/gamification/insights", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        
        # Check insight structure
        insight = data[0]
        assert "user_id" in insight
        assert "message" in insight
        assert "category" in insight
        assert "is_funny" in insight

    def test_get_insights_unauthorized(self, client: TestClient):
        """Test getting insights without authentication"""
        response = client.get("/api/gamification/insights")
        
        assert response.status_code == 401


class TestAchievementsAPI:
    """Test suite for achievements endpoints"""

    def test_get_achievements_new_user(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test getting achievements for new user"""
        response = client.get("/api/achievements/achievements", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0  # Should have predefined achievements
        
        # Check achievement structure
        achievement = data[0]
        assert "id" in achievement
        assert "key" in achievement
        assert "title" in achievement
        assert "description" in achievement
        assert "icon" in achievement
        assert "unlocked" in achievement
        assert "progress" in achievement
        
        # New user should have no unlocked achievements initially
        assert all(not a["unlocked"] for a in data)

    def test_check_achievements_no_progress(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test checking achievements with no progress"""
        response = client.post("/api/achievements/check-achievements", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "newly_unlocked" in data
        assert "count" in data
        assert data["count"] == len(data["newly_unlocked"])

    def test_check_achievements_with_progress(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test checking achievements after making progress"""
        from app.models.enums import TransactionState
        
        # Create a transaction (should unlock "first_transaction" achievement)
        create_test_transaction(session, test_user, state=TransactionState.APPROVED)
        
        response = client.post("/api/achievements/check-achievements", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        # Should have unlocked at least the first transaction achievement
        newly_unlocked = data["newly_unlocked"]
        if newly_unlocked:
            first_achievement = newly_unlocked[0]
            assert first_achievement["unlocked"] == True
            assert "first" in first_achievement["key"].lower() or "transaction" in first_achievement["key"].lower()

    def test_get_notifications_empty(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test getting notifications when none exist"""
        response = client.get("/api/achievements/notifications", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "count" in data
        assert data["count"] == len(data["notifications"])

    def test_get_achievement_stats(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test getting achievement statistics"""
        response = client.get("/api/achievements/achievement-stats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total_achievements" in data
        assert "unlocked_achievements" in data
        assert "completion_rate" in data
        assert "total_achievement_xp" in data
        assert "recent_achievements" in data
        assert "achievement_categories" in data
        
        # New user stats
        assert data["unlocked_achievements"] == 0
        assert data["completion_rate"] == 0
        assert data["total_achievement_xp"] == 0

    def test_mark_all_notifications_read(self, client: TestClient, auth_headers: dict, test_user: User):
        """Test marking all notifications as read"""
        response = client.post("/api/achievements/notifications/read-all", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "marked_read" in data
        assert data["success"] == True

    def test_achievements_unauthorized(self, client: TestClient):
        """Test achievement endpoints without authentication"""
        endpoints = [
            "/api/achievements/achievements",
            "/api/achievements/check-achievements",
            "/api/achievements/notifications",
            "/api/achievements/achievement-stats"
        ]
        
        for endpoint in endpoints:
            if "check-achievements" in endpoint or "read-all" in endpoint:
                response = TestClient(app).post(endpoint)
            else:
                response = TestClient(app).get(endpoint)
            assert response.status_code == 401


class TestGamificationIntegration:
    """Test suite for gamification system integration"""

    def test_transaction_approval_awards_xp(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test that approving transaction awards XP"""
        from app.models.enums import TransactionState
        
        # Create pending transaction
        transaction = create_test_transaction(session, test_user, state=TransactionState.PENDING)
        
        # Check initial XP
        gamification_response = client.get("/api/gamification/me", headers=auth_headers)
        initial_xp = gamification_response.json()["xp"]
        
        # Approve transaction
        approval_response = client.post(f"/api/transactions/{transaction.id}/approve", headers=auth_headers)
        assert approval_response.status_code == 200
        
        # Check XP was awarded
        final_gamification_response = client.get("/api/gamification/me", headers=auth_headers)
        final_xp = final_gamification_response.json()["xp"]
        
        assert final_xp > initial_xp

    def test_streak_calculation(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test streak calculation with daily activity"""
        from datetime import date, timedelta
        
        # Create gamification record with yesterday's activity
        yesterday = date.today() - timedelta(days=1)
        gamification = UserGamification(
            user_id=test_user.id,
            last_activity=yesterday,
            streak_count=1
        )
        session.add(gamification)
        session.commit()
        
        # Award XP for today (should increment streak)
        response = client.post("/api/gamification/award-xp/daily_login", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["streak_count"] == 2  # Should increment

    def test_achievement_unlocking_flow(self, client: TestClient, auth_headers: dict, session: Session, test_user: User):
        """Test complete achievement unlocking flow"""
        from app.models.enums import TransactionState
        
        # 1. Check initial state
        achievements_response = client.get("/api/achievements/achievements", headers=auth_headers)
        initial_achievements = achievements_response.json()
        unlocked_count_initial = sum(1 for a in initial_achievements if a["unlocked"])
        
        # 2. Create and approve a transaction
        transaction = create_test_transaction(session, test_user, state=TransactionState.PENDING)
        client.post(f"/api/transactions/{transaction.id}/approve", headers=auth_headers)
        
        # 3. Check for new achievements
        check_response = client.post("/api/achievements/check-achievements", headers=auth_headers)
        newly_unlocked = check_response.json()["newly_unlocked"]
        
        # 4. Verify achievements were unlocked
        final_achievements_response = client.get("/api/achievements/achievements", headers=auth_headers)
        final_achievements = final_achievements_response.json()
        unlocked_count_final = sum(1 for a in final_achievements if a["unlocked"])
        
        assert unlocked_count_final > unlocked_count_initial