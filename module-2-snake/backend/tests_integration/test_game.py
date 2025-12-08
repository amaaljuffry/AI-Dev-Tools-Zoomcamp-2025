"""Integration tests for game endpoints"""
import pytest


class TestStartGame:
    """Tests for POST /api/game/start"""
    
    def test_start_game_authenticated(self, client, auth_headers):
        """Test starting a game when authenticated"""
        response = client.post("/api/game/start", headers=auth_headers)
        
        assert response.status_code == 201
        data = response.json()
        assert "id" in data
        assert data["is_active"] is True
        assert data["score"] == 0
    
    def test_start_game_unauthenticated(self, client):
        """Test starting a game without authentication fails"""
        response = client.post("/api/game/start")
        
        assert response.status_code == 403
    
    def test_start_game_ends_previous(self, client, auth_headers):
        """Test starting a new game ends any active games"""
        # Start first game
        response1 = client.post("/api/game/start", headers=auth_headers)
        game1_id = response1.json()["id"]
        
        # Start second game
        response2 = client.post("/api/game/start", headers=auth_headers)
        game2_id = response2.json()["id"]
        
        assert game1_id != game2_id
        assert response2.json()["is_active"] is True


class TestEndGame:
    """Tests for POST /api/game/{game_id}/end"""
    
    def test_end_game_success(self, client, auth_headers):
        """Test ending a game with score"""
        # Start a game first
        start_response = client.post("/api/game/start", headers=auth_headers)
        game_id = start_response.json()["id"]
        
        # End the game
        response = client.post(
            f"/api/game/{game_id}/end",
            headers=auth_headers,
            json={"score": 150, "duration": 60}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["score"] == 150
        assert data["is_active"] is False
        assert data["duration"] == 60
    
    def test_end_game_not_found(self, client, auth_headers):
        """Test ending a non-existent game fails"""
        response = client.post(
            "/api/game/99999/end",
            headers=auth_headers,
            json={"score": 100, "duration": 30}
        )
        
        assert response.status_code == 404
    
    def test_end_game_unauthorized(self, client, auth_headers, second_user):
        """Test ending another user's game fails"""
        # Start game as first user
        start_response = client.post("/api/game/start", headers=auth_headers)
        game_id = start_response.json()["id"]
        
        # Try to end as second user
        second_headers = {"Authorization": f"Bearer {second_user['token']}"}
        response = client.post(
            f"/api/game/{game_id}/end",
            headers=second_headers,
            json={"score": 100, "duration": 30}
        )
        
        assert response.status_code == 403


class TestActiveGames:
    """Tests for GET /api/game/active"""
    
    def test_get_active_games(self, client, auth_headers):
        """Test getting list of active games"""
        # Start a game
        client.post("/api/game/start", headers=auth_headers)
        
        # Get active games
        response = client.get("/api/game/active")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
    
    def test_active_games_public(self, client):
        """Test active games endpoint is public"""
        response = client.get("/api/game/active")
        
        assert response.status_code == 200


class TestUserStats:
    """Tests for GET /api/game/user/{user_id}/stats"""
    
    def test_get_user_stats(self, client, test_user, auth_headers):
        """Test getting user statistics"""
        # Play some games
        for score in [100, 200, 150]:
            start_resp = client.post("/api/game/start", headers=auth_headers)
            game_id = start_resp.json()["id"]
            client.post(
                f"/api/game/{game_id}/end",
                headers=auth_headers,
                json={"score": score, "duration": 30}
            )
        
        # Get stats
        response = client.get(f"/api/game/user/{test_user['id']}/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert data["games_played"] == 3
        assert data["high_score"] == 200
        assert data["total_score"] == 450
