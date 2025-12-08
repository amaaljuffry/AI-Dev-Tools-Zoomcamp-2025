import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCw, Settings, LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from './config';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE = [{x: 10, y: 10}];
const INITIAL_DIRECTION = {x: 1, y: 0};
const GAME_SPEED = 150;

// Game modes
const GAME_MODES = {
  WALLS: 'walls',
  PASS_THROUGH: 'pass-through'
};

export default function SnakeGame() {
  const [snake, setSnake] = useState(INITIAL_SNAKE);
  const [food, setFood] = useState({x: 15, y: 15});
  const [direction, setDirection] = useState(INITIAL_DIRECTION);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameId, setGameId] = useState(null);
  const [scoreSaved, setScoreSaved] = useState(false);
  const [gameMode, setGameMode] = useState(GAME_MODES.WALLS);
  const [showOptions, setShowOptions] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();
  const gameStartTimeRef = useRef(null);

  const startGameSession = useCallback(async () => {
    if (!user || !token) return null;
    
    try {
      const response = await fetch(`${API_BASE_URL}/game/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        gameStartTimeRef.current = Date.now();
        return data.id;
      }
    } catch (error) {
      console.error('Error starting game session:', error);
    }
    return null;
  }, [user, token]);

  const endGameSession = useCallback(async (finalScore) => {
    if (!user || !token || scoreSaved) return;
    
    const duration = gameStartTimeRef.current 
      ? Math.floor((Date.now() - gameStartTimeRef.current) / 1000) 
      : 0;
    
    try {
      // End the game session if we have one
      if (gameId) {
        await fetch(`${API_BASE_URL}/game/${gameId}/end`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ score: finalScore, duration })
        });
      }
      
      // Always submit to leaderboard if user is logged in
      const leaderboardResponse = await fetch(`${API_BASE_URL}/leaderboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score: finalScore, mode: gameMode })
      });
      
      if (leaderboardResponse.ok) {
        setScoreSaved(true);
      } else {
        console.error('Failed to save score:', await leaderboardResponse.text());
      }
    } catch (error) {
      console.error('Error ending game session:', error);
    }
  }, [user, token, gameId, scoreSaved, gameMode]);

  const generateFood = useCallback(() => {
    const newFood = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
    return newFood;
  }, []);

  const resetGame = async () => {
    setSnake(INITIAL_SNAKE);
    setFood(generateFood());
    setDirection(INITIAL_DIRECTION);
    setGameOver(false);
    setScore(0);
    setIsPaused(false);
    setScoreSaved(false);
    
    // Start a new game session
    const newGameId = await startGameSession();
    setGameId(newGameId);
  };

  const checkCollision = useCallback((head) => {
    // In pass-through mode, wall collision doesn't end the game
    if (gameMode === 'walls') {
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        return true;
      }
    }
    // Self-collision always ends the game
    for (let segment of snake.slice(1)) {
      if (head.x === segment.x && head.y === segment.y) {
        return true;
      }
    }
    return false;
  }, [snake, gameMode]);

  const moveSnake = useCallback(() => {
    if (gameOver || isPaused) return;

    setSnake(prevSnake => {
      const head = prevSnake[0];
      let newHead = {
        x: head.x + direction.x,
        y: head.y + direction.y
      };

      // In pass-through mode, wrap around to the other side
      if (gameMode === 'pass-through') {
        newHead.x = (newHead.x + GRID_SIZE) % GRID_SIZE;
        newHead.y = (newHead.y + GRID_SIZE) % GRID_SIZE;
      }

      if (checkCollision(newHead)) {
        setGameOver(true);
        return prevSnake;
      }

      const newSnake = [newHead, ...prevSnake];

      if (newHead.x === food.x && newHead.y === food.y) {
        setScore(s => s + 10);
        setFood(generateFood());
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [direction, food, gameOver, isPaused, checkCollision, generateFood, gameMode]);

  useEffect(() => {
    const handleKeyPress = (e) => {
      // Prevent default scrolling for game keys
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      
      if (gameOver) return;

      switch(e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          if (direction.y === 0) setDirection({x: 0, y: -1});
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          if (direction.y === 0) setDirection({x: 0, y: 1});
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          if (direction.x === 0) setDirection({x: -1, y: 0});
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          if (direction.x === 0) setDirection({x: 1, y: 0});
          break;
        case ' ':
          setIsPaused(p => !p);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [direction, gameOver]);

  // End game session and save score when game ends
  useEffect(() => {
    if (gameOver && !scoreSaved) {
      endGameSession(score);
    }
  }, [gameOver, score, scoreSaved, endGameSession]);

  // Start game session when game starts (not on mount)
  const handleStartGame = async () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setScoreSaved(false);
    setSnake(INITIAL_SNAKE);
    setFood({x: 15, y: 15});
    setDirection(INITIAL_DIRECTION);
    setIsPaused(false);
    
    if (user && token) {
      const newGameId = await startGameSession();
      setGameId(newGameId);
    }
  };

  useEffect(() => {
    if (!gameStarted) return;
    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [moveSnake, gameStarted]);

  const isSnakeSegment = (x, y) => {
    return snake.some(segment => segment.x === x && segment.y === y);
  };

  const isFood = (x, y) => {
    return food.x === x && food.y === y;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-light tracking-tight text-black">Snake</h1>
          <div className="text-sm font-mono text-black">{score.toString().padStart(3, '0')}</div>
        </div>
        
        <div 
          className="border border-black bg-white relative"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE
          }}
        >
          {Array.from({length: GRID_SIZE}).map((_, y) => (
            <div key={y} className="flex">
              {Array.from({length: GRID_SIZE}).map((_, x) => (
                <div
                  key={`${x}-${y}`}
                  className={`
                    ${isSnakeSegment(x, y) ? 'bg-black' : ''}
                    ${isFood(x, y) ? 'bg-black' : ''}
                  `}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    borderRight: '1px solid #e5e5e5',
                    borderBottom: '1px solid #e5e5e5'
                  }}
                />
              ))}
            </div>
          ))}
          
          {!gameStarted && (
            <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center">
              <div className="text-center space-y-6">
                <div className="text-4xl font-light text-black">Snake</div>
                <button
                  onClick={handleStartGame}
                  className="px-8 py-3 bg-black text-white hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
                >
                  <Play size={20} />
                  <span className="text-lg font-light">Play</span>
                </button>
                
                <div className="pt-4 border-t border-gray-200">
                  {user ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                        <User size={14} />
                        <span>Logged in as {user.username || user.email}</span>
                      </div>
                      <button
                        onClick={logout}
                        className="text-xs text-gray-500 hover:text-black flex items-center gap-1 mx-auto"
                      >
                        <LogOut size={12} />
                        <span>Logout</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => navigate('/login')}
                      className="text-sm text-gray-600 hover:text-black flex items-center gap-2 mx-auto"
                    >
                      <LogIn size={14} />
                      <span>Login to save scores</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {gameStarted && gameOver && (
            <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-4xl font-light text-black">Game Over</div>
                <div className="text-sm font-mono text-black">{score.toString().padStart(3, '0')}</div>
                {user && scoreSaved && (
                  <div className="text-xs text-green-600">Score saved to leaderboard!</div>
                )}
                {user && !scoreSaved && gameId && (
                  <div className="text-xs text-gray-500">Saving score...</div>
                )}
                {!user && (
                  <div className="text-xs text-gray-500">Login to save your scores!</div>
                )}
                <button
                  onClick={handleStartGame}
                  className="mt-4 px-6 py-2 bg-black text-white hover:bg-gray-800 transition-colors duration-200 flex items-center justify-center gap-2 mx-auto"
                >
                  <Play size={16} />
                  <span>Play Again</span>
                </button>
              </div>
            </div>
          )}

          {isPaused && !gameOver && (
            <div className="absolute inset-0 bg-white bg-opacity-95 flex items-center justify-center">
              <div className="text-2xl font-light text-black">Paused</div>
            </div>
          )}
        </div>

        {gameStarted && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsPaused(p => !p)}
              disabled={gameOver}
              className="flex-1 h-10 px-4 border border-black bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black transition-colors duration-200 flex items-center justify-center gap-2"
            >
              {isPaused ? <Play size={16} /> : <Pause size={16} />}
              <span className="text-sm font-light">{isPaused ? 'Resume' : 'Pause'}</span>
            </button>
            <button
              onClick={resetGame}
              className="h-10 px-4 border border-black bg-black text-white hover:bg-white hover:text-black transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <RotateCw size={16} />
              <span className="text-sm font-light">Reset</span>
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 border border-black p-2">
          <Settings size={14} className="text-gray-500" />
          <span className="text-xs font-light text-gray-500">Mode:</span>
          <button
            onClick={() => setGameMode('walls')}
            disabled={gameStarted && !gameOver && !isPaused && snake.length > 1}
            className={`px-3 py-1 text-xs border transition-colors duration-200 ${
              gameMode === 'walls'
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-gray-300 hover:border-black'
            } disabled:opacity-50`}
          >
            Walls
          </button>
          <button
            onClick={() => setGameMode('pass-through')}
            disabled={gameStarted && !gameOver && !isPaused && snake.length > 1}
            className={`px-3 py-1 text-xs border transition-colors duration-200 ${
              gameMode === 'pass-through'
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-gray-300 hover:border-black'
            } disabled:opacity-50`}
          >
            Pass Through
          </button>
        </div>

        <div className="text-xs font-light text-black opacity-60 space-y-1 max-w-md">
          <div>Arrow keys or WASD to move</div>
          <div>Space to pause</div>
          <div className="italic">
            {gameMode === 'walls' 
              ? 'Hit the wall = game over' 
              : 'Pass through walls to the other side'}
          </div>
        </div>

        {/* User status at bottom */}
        {gameStarted && (
          <div className="text-center pt-2 border-t border-gray-200">
            {user ? (
              <div className="flex items-center justify-center gap-4">
                <span className="text-xs text-green-600 flex items-center gap-1">
                  <User size={12} />
                  {user.username || user.email}
                </span>
                <button
                  onClick={logout}
                  className="text-xs text-gray-400 hover:text-black flex items-center gap-1"
                >
                  <LogOut size={10} />
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="text-xs text-gray-500 hover:text-black flex items-center gap-1 mx-auto"
              >
                <LogIn size={12} />
                Login to save scores
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}