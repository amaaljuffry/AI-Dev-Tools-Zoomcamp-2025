"""
Pytest fixtures for integration tests.
Uses a separate SQLite database for testing.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db
from app.db_models import User
from app.auth import create_access_token

# Test database URL - uses SQLite file for integration tests
TEST_DATABASE_URL = "sqlite:///./test_integration.db"

# Create test engine
engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    """Override the database dependency with test database"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(scope="function")
def test_db():
    """Create a fresh database for each test"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = TestingSessionLocal()
    yield db
    
    # Cleanup: drop all tables after test
    db.close()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(test_db):
    """Create a test client with overridden database"""
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clear overrides after test
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(test_db) -> dict:
    """Create a test user and return user data with token"""
    user = User(
        username="testuser",
        email="test@example.com"
    )
    user.set_password("testpassword123")
    
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    
    # Create access token
    token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "token": token,
        "password": "testpassword123"
    }


@pytest.fixture
def auth_headers(test_user) -> dict:
    """Return authorization headers for authenticated requests"""
    return {"Authorization": f"Bearer {test_user['token']}"}


@pytest.fixture
def second_user(test_db) -> dict:
    """Create a second test user for multi-user tests"""
    user = User(
        username="seconduser",
        email="second@example.com"
    )
    user.set_password("password456")
    
    test_db.add(user)
    test_db.commit()
    test_db.refresh(user)
    
    token = create_access_token(data={"sub": str(user.id)})
    
    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "token": token
    }
