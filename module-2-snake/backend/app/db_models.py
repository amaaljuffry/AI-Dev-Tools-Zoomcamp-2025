from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import bcrypt
import enum

from app.database import Base


class GameModeEnum(str, enum.Enum):
    WALLS = "walls"
    PASS_THROUGH = "pass-through"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, nullable=False, index=True)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    games = relationship("Game", back_populates="player", cascade="all, delete-orphan")
    leaderboard_entries = relationship("LeaderboardEntryDB", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password: str):
        """Hash and set the user's password"""
        self.password_hash = bcrypt.hashpw(
            password.encode("utf-8"), bcrypt.gensalt()
        ).decode("utf-8")

    def check_password(self, password: str) -> bool:
        """Check if the provided password matches the hash"""
        return bcrypt.checkpw(
            password.encode("utf-8"), self.password_hash.encode("utf-8")
        )

    def to_dict(self):
        """Convert user object to dictionary"""
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Game(Base):
    __tablename__ = "games"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    score = Column(Integer, nullable=False, default=0)
    duration = Column(Integer, nullable=False, default=0)  # in seconds
    mode = Column(String(20), default="walls")
    is_active = Column(Boolean, default=True, index=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)

    # Relationships
    player = relationship("User", back_populates="games")

    def to_dict(self):
        """Convert game object to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "username": self.player.username if self.player else None,
            "score": self.score,
            "duration": self.duration,
            "mode": self.mode,
            "is_active": self.is_active,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "ended_at": self.ended_at.isoformat() if self.ended_at else None,
        }


class LeaderboardEntryDB(Base):
    __tablename__ = "leaderboard"

    id = Column(String(36), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    username = Column(String(80), nullable=False)
    score = Column(Integer, nullable=False, index=True)
    mode = Column(String(20), default="walls", index=True)
    duration = Column(Integer, default=0)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    user = relationship("User", back_populates="leaderboard_entries")

    def to_dict(self):
        """Convert leaderboard entry to dictionary"""
        return {
            "id": self.id,
            "username": self.username,
            "score": self.score,
            "mode": self.mode,
            "duration": self.duration,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }
