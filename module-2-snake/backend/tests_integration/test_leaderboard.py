"""Integration tests for leaderboard endpoints"""
import pytest


class TestGetLeaderboard:
    """Tests for GET /api/leaderboard"""
    
    def test_get_leaderboard_empty(self, client):
        """Test getting empty leaderboard"""
        response = client.get("/api/leaderboard")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_leaderboard_with_entries(self, client, auth_headers):
        """Test getting leaderboard with entries"""
        # Submit some scores
        for score in [100, 200, 150]:
            client.post(
                "/api/leaderboard",
                headers=auth_headers,
                json={"score": score, "mode": "walls"}
            )
        
        response = client.get("/api/leaderboard")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        # Should be sorted by score descending
        assert data[0]["score"] == 200
        assert data[1]["score"] == 150
        assert data[2]["score"] == 100
    
    def test_get_leaderboard_with_limit(self, client, auth_headers):
        """Test leaderboard with limit parameter"""
        # Submit multiple scores
        for score in range(10, 110, 10):
            client.post(
                "/api/leaderboard",
                headers=auth_headers,
                json={"score": score, "mode": "walls"}
            )
        
        response = client.get("/api/leaderboard?limit=5")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
    
    def test_get_leaderboard_filter_by_mode(self, client, auth_headers):
        """Test filtering leaderboard by game mode"""
        # Submit scores for different modes
        client.post("/api/leaderboard", headers=auth_headers, 
                    json={"score": 100, "mode": "walls"})
        client.post("/api/leaderboard", headers=auth_headers,
                    json={"score": 200, "mode": "pass-through"})
        
        # Filter by walls mode
        response = client.get("/api/leaderboard?mode=walls")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["mode"] == "walls"


class TestSubmitScore:
    """Tests for POST /api/leaderboard"""
    
    def test_submit_score_success(self, client, test_user, auth_headers):
        """Test submitting a score"""
        response = client.post(
            "/api/leaderboard",
            headers=auth_headers,
            json={"score": 250, "mode": "walls"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "Score submitted successfully"
        assert "id" in data
    
    def test_submit_score_pass_through_mode(self, client, auth_headers):
        """Test submitting score with pass-through mode"""
        response = client.post(
            "/api/leaderboard",
            headers=auth_headers,
            json={"score": 300, "mode": "pass-through"}
        )
        
        assert response.status_code == 201
    
    def test_submit_score_unauthenticated(self, client):
        """Test submitting score without authentication fails"""
        response = client.post(
            "/api/leaderboard",
            json={"score": 100, "mode": "walls"}
        )
        
        assert response.status_code == 403
    
    def test_submit_score_invalid_mode(self, client, auth_headers):
        """Test submitting score with invalid mode fails"""
        response = client.post(
            "/api/leaderboard",
            headers=auth_headers,
            json={"score": 100, "mode": "invalid-mode"}
        )
        
        assert response.status_code == 422


class TestUserLeaderboard:
    """Tests for GET /api/leaderboard/user/{user_id}"""
    
    def test_get_user_leaderboard(self, client, test_user, auth_headers):
        """Test getting a specific user's scores"""
        # Submit some scores
        for score in [100, 200, 150]:
            client.post(
                "/api/leaderboard",
                headers=auth_headers,
                json={"score": score, "mode": "walls"}
            )
        
        response = client.get(f"/api/leaderboard/user/{test_user['id']}")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
        # Verify all entries belong to test user
        for entry in data:
            assert entry["username"] == test_user["username"]
    
    def test_get_user_leaderboard_empty(self, client, test_user):
        """Test getting scores for user with no entries"""
        response = client.get(f"/api/leaderboard/user/{test_user['id']}")
        
        assert response.status_code == 200
        assert response.json() == []


class TestTopLeaderboard:
    """Tests for GET /api/leaderboard/top"""
    
    def test_get_top_leaderboard(self, client, auth_headers, second_user):
        """Test getting top 10 leaderboard"""
        # Submit scores from multiple users
        client.post("/api/leaderboard", headers=auth_headers,
                    json={"score": 500, "mode": "walls"})
        
        second_headers = {"Authorization": f"Bearer {second_user['token']}"}
        client.post("/api/leaderboard", headers=second_headers,
                    json={"score": 300, "mode": "walls"})
        
        response = client.get("/api/leaderboard/top")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 10
        # Verify sorted by score descending
        if len(data) >= 2:
            assert data[0]["score"] >= data[1]["score"]
