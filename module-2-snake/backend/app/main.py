from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.database import engine, Base
from app.routers import auth, game, leaderboard


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create database tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown: cleanup if needed


app = FastAPI(
    title="Snake Arena Online API",
    description="API for Snake Arena Online game",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan
)

# CORS configuration - Allow frontend origins
# In Docker, nginx proxies requests so we allow the frontend container
import os
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001,http://localhost:3080,http://127.0.0.1:3000,http://localhost,http://frontend").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(game.router, prefix="/api/game", tags=["Game"])
app.include_router(leaderboard.router, prefix="/api/leaderboard", tags=["Leaderboard"])


@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Snake Arena Online API is running"}


@app.get("/api", tags=["System"])
async def api_root():
    """API root endpoint"""
    return {
        "message": "Welcome to Snake Arena Online API",
        "docs": "/api/docs",
        "redoc": "/api/redoc"
    }
