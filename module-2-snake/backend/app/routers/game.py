from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime
from typing import List

from app.database import get_db
from app.db_models import User, Game
from app.schemas import GameResponse, GameEnd, LeaderboardEntry, UserStats
from app.auth import get_current_user

router = APIRouter()


@router.post("/start", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
async def start_game(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new game"""
    # End any active games for this user
    active_games = db.query(Game).filter(
        Game.user_id == current_user.id,
        Game.is_active == True
    ).all()
    
    for game in active_games:
        game.is_active = False
        game.ended_at = datetime.utcnow()
    
    # Create new game
    game = Game(user_id=current_user.id)
    db.add(game)
    db.commit()
    db.refresh(game)
    
    return GameResponse(
        id=game.id,
        user_id=game.user_id,
        username=current_user.username,
        score=game.score,
        duration=game.duration,
        is_active=game.is_active,
        started_at=game.started_at,
        ended_at=game.ended_at
    )


@router.post("/{game_id}/end", response_model=GameResponse)
async def end_game(
    game_id: int,
    game_data: GameEnd,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """End a game and save score"""
    game = db.query(Game).filter(Game.id == game_id).first()
    
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    if game.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized"
        )
    
    # Update game
    game.score = game_data.score
    game.duration = game_data.duration or 0
    game.is_active = False
    game.ended_at = datetime.utcnow()
    
    db.commit()
    db.refresh(game)
    
    return GameResponse(
        id=game.id,
        user_id=game.user_id,
        username=current_user.username,
        score=game.score,
        duration=game.duration,
        is_active=game.is_active,
        started_at=game.started_at,
        ended_at=game.ended_at
    )


@router.get("/active", response_model=List[GameResponse])
async def get_active_games(db: Session = Depends(get_db)):
    """Get all active games for spectating"""
    games = db.query(Game).filter(
        Game.is_active == True
    ).order_by(desc(Game.score)).limit(20).all()
    
    result = []
    for game in games:
        # Calculate duration for active games
        duration = game.duration
        if game.started_at:
            duration = int((datetime.utcnow() - game.started_at).total_seconds())
        
        result.append(GameResponse(
            id=game.id,
            user_id=game.user_id,
            username=game.player.username if game.player else None,
            score=game.score,
            duration=duration,
            is_active=game.is_active,
            started_at=game.started_at,
            ended_at=game.ended_at
        ))
    
    return result


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(limit: int = 50, db: Session = Depends(get_db)):
    """Get top scores leaderboard"""
    # Get top scores
    top_games = db.query(Game).filter(
        Game.is_active == False
    ).order_by(desc(Game.score)).limit(limit).all()
    
    leaderboard = []
    for rank, game in enumerate(top_games, 1):
        leaderboard.append(LeaderboardEntry(
            rank=rank,
            username=game.player.username if game.player else "Unknown",
            score=game.score,
            duration=game.duration,
            played_at=game.ended_at
        ))
    
    return leaderboard


@router.get("/user/{user_id}/stats", response_model=UserStats)
async def get_user_stats(user_id: int, db: Session = Depends(get_db)):
    """Get user statistics"""
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Get user's completed games
    games = db.query(Game).filter(
        Game.user_id == user_id,
        Game.is_active == False
    ).all()
    
    games_played = len(games)
    high_score = max((g.score for g in games), default=0)
    total_score = sum(g.score for g in games)
    average_score = total_score / games_played if games_played > 0 else 0.0
    
    return UserStats(
        user_id=user.id,
        username=user.username,
        games_played=games_played,
        high_score=high_score,
        total_score=total_score,
        average_score=round(average_score, 2)
    )
