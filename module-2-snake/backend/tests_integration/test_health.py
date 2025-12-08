"""Integration tests for health and system endpoints"""


def test_health_check(client):
    """Test the health check endpoint"""
    response = client.get("/health")
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"


def test_api_root(client):
    """Test the API root endpoint"""
    response = client.get("/api")
    
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
