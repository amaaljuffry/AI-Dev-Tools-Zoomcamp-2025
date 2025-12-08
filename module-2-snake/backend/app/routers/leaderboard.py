from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timezone
import uuid

from app.database import get_db
from app.db_models import User, LeaderboardEntryDB
from app.schemas import LeaderboardEntry, SubmitScoreRequest, GameMode
from app.auth import get_current_user

router = APIRouter()


@router.get("", response_model=List[LeaderboardEntry])
async def get_leaderboard_entries(
    mode: Optional[GameMode] = None,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get leaderboard entries, optionally filtered by game mode"""
    query = db.query(LeaderboardEntryDB)
    
    if mode:
        query = query.filter(LeaderboardEntryDB.mode == mode.value)
    
    entries = query.order_by(desc(LeaderboardEntryDB.score)).limit(limit).all()
    
    result = []
    for rank, entry in enumerate(entries, 1):
        result.append(LeaderboardEntry(
            id=entry.id,
            rank=rank,
            username=entry.username,
            score=entry.score,
            mode=GameMode(entry.mode) if entry.mode else GameMode.WALLS,
            duration=entry.duration or 0,
            timestamp=entry.timestamp,
            played_at=entry.timestamp
        ))
    
    return result


@router.post("", status_code=status.HTTP_201_CREATED)
async def submit_score(
    request: SubmitScoreRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Submit a new score to the leaderboard"""
    entry = LeaderboardEntryDB(
        id=str(uuid.uuid4()),
        user_id=current_user.id,
        username=current_user.username,
        score=request.score,
        mode=request.mode.value,
        timestamp=datetime.now(timezone.utc)
    )
    
    db.add(entry)
    db.commit()
    db.refresh(entry)
    
    return {"message": "Score submitted successfully", "id": entry.id}


@router.get("/user/{user_id}", response_model=List[LeaderboardEntry])
async def get_user_scores(
    user_id: int,
    limit: int = Query(10, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Get a specific user's leaderboard entries"""
    entries = db.query(LeaderboardEntryDB).filter(
        LeaderboardEntryDB.user_id == user_id
    ).order_by(desc(LeaderboardEntryDB.score)).limit(limit).all()
    
    result = []
    for rank, entry in enumerate(entries, 1):
        result.append(LeaderboardEntry(
            id=entry.id,
            rank=rank,
            username=entry.username,
            score=entry.score,
            mode=GameMode(entry.mode) if entry.mode else GameMode.WALLS,
            duration=entry.duration or 0,
            timestamp=entry.timestamp,
            played_at=entry.timestamp
        ))
    
    return result


@router.get("/top", response_model=List[LeaderboardEntry])
async def get_top_scores(
    mode: Optional[GameMode] = None,
    db: Session = Depends(get_db)
):
    """Get top 10 scores"""
    query = db.query(LeaderboardEntryDB)
    
    if mode:
        query = query.filter(LeaderboardEntryDB.mode == mode.value)
    
    entries = query.order_by(desc(LeaderboardEntryDB.score)).limit(10).all()
    
    result = []
    for rank, entry in enumerate(entries, 1):
        result.append(LeaderboardEntry(
            id=entry.id,
            rank=rank,
            username=entry.username,
            score=entry.score,
            mode=GameMode(entry.mode) if entry.mode else GameMode.WALLS,
            duration=entry.duration or 0,
            timestamp=entry.timestamp,
            played_at=entry.timestamp
        ))
    
    return result
