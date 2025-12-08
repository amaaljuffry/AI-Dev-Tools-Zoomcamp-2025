"""Integration tests for authentication endpoints"""
import pytest


class TestSignup:
    """Tests for POST /api/auth/signup"""
    
    def test_signup_success(self, client):
        """Test successful user registration"""
        response = client.post("/api/auth/signup", json={
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "securepassword123"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["message"] == "User created successfully"
        assert "access_token" in data
        assert data["user"]["username"] == "newuser"
        assert data["user"]["email"] == "newuser@example.com"
    
    def test_signup_duplicate_username(self, client, test_user):
        """Test signup with existing username fails"""
        response = client.post("/api/auth/signup", json={
            "username": test_user["username"],  # Already exists
            "email": "different@example.com",
            "password": "password123"
        })
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_signup_duplicate_email(self, client, test_user):
        """Test signup with existing email fails"""
        response = client.post("/api/auth/signup", json={
            "username": "differentuser",
            "email": test_user["email"],  # Already exists
            "password": "password123"
        })
        
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"].lower()
    
    def test_signup_invalid_email(self, client):
        """Test signup with invalid email format"""
        response = client.post("/api/auth/signup", json={
            "username": "validuser",
            "email": "not-an-email",
            "password": "password123"
        })
        
        assert response.status_code == 422  # Validation error


class TestLogin:
    """Tests for POST /api/auth/login"""
    
    def test_login_success(self, client, test_user):
        """Test successful login"""
        response = client.post("/api/auth/login", json={
            "username": test_user["username"],
            "password": test_user["password"]
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Login successful"
        assert "access_token" in data
        assert data["user"]["username"] == test_user["username"]
    
    def test_login_wrong_password(self, client, test_user):
        """Test login with wrong password"""
        response = client.post("/api/auth/login", json={
            "username": test_user["username"],
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        assert "invalid" in response.json()["detail"].lower()
    
    def test_login_nonexistent_user(self, client):
        """Test login with non-existent username"""
        response = client.post("/api/auth/login", json={
            "username": "nonexistent",
            "password": "anypassword"
        })
        
        assert response.status_code == 401


class TestGetCurrentUser:
    """Tests for GET /api/auth/me"""
    
    def test_get_me_authenticated(self, client, test_user, auth_headers):
        """Test getting current user info when authenticated"""
        response = client.get("/api/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["username"] == test_user["username"]
        assert data["email"] == test_user["email"]
    
    def test_get_me_unauthenticated(self, client):
        """Test getting current user without token fails"""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 403  # No credentials
    
    def test_get_me_invalid_token(self, client):
        """Test getting current user with invalid token"""
        response = client.get("/api/auth/me", headers={
            "Authorization": "Bearer invalid-token-here"
        })
        
        assert response.status_code == 401
