from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum


# Enums
class GameMode(str, Enum):
    WALLS = "walls"
    PASS_THROUGH = "pass-through"


# Auth Schemas
class UserBase(BaseModel):
    username: str
    email: EmailStr


class UserCreate(UserBase):
    password: str


class UserLogin(BaseModel):
    username: str
    password: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AuthResponse(BaseModel):
    message: str
    access_token: str
    user: UserResponse


class TokenData(BaseModel):
    user_id: Optional[int] = None


# Game Schemas
class GameBase(BaseModel):
    score: int = 0
    duration: int = 0


class GameCreate(BaseModel):
    pass


class GameEnd(BaseModel):
    score: int
    duration: Optional[int] = 0


class GameResponse(BaseModel):
    id: int
    user_id: int
    username: Optional[str] = None
    score: int
    duration: int
    is_active: bool
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class LeaderboardEntry(BaseModel):
    id: Optional[str] = None
    rank: Optional[int] = None
    username: str
    score: int
    mode: Optional[GameMode] = GameMode.WALLS
    duration: Optional[int] = 0
    timestamp: Optional[datetime] = None
    played_at: Optional[datetime] = None


class SubmitScoreRequest(BaseModel):
    score: int
    mode: GameMode = GameMode.WALLS


class UserStats(BaseModel):
    user_id: int
    username: str
    games_played: int
    high_score: int
    total_score: int
    average_score: float
