import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Play, Trophy, Eye, LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAuthClick = () => {
    if (user) {
      logout();
    } else {
      navigate('/login');
    }
  };

  return (
    <nav className="bg-white border-b border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="text-xl font-light tracking-tight text-black hover:opacity-60 transition-opacity">
            Snake Game
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="h-10 px-4 border border-black bg-white hover:bg-black hover:text-white transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Play size={16} />
              <span className="text-sm font-light">Play</span>
            </Link>

            <Link
              to="/leaderboard"
              className="h-10 px-4 border border-black bg-white hover:bg-black hover:text-white transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Trophy size={16} />
              <span className="text-sm font-light">Leaderboard</span>
            </Link>

            <Link
              to="/spectate"
              className="h-10 px-4 border border-black bg-white hover:bg-black hover:text-white transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <Eye size={16} />
              <span className="text-sm font-light">Spectate</span>
            </Link>

            {/* User Section */}
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-black">
              {user && (
                <span className="text-sm font-light text-black">
                  {user.username}
                </span>
              )}
              <button
                onClick={handleAuthClick}
                className={`h-10 px-4 border border-black transition-colors duration-200 flex items-center justify-center gap-2 ${
                  user
                    ? 'bg-white hover:bg-black hover:text-white'
                    : 'bg-black text-white hover:bg-white hover:text-black'
                }`}
              >
                {user ? <LogOut size={16} /> : <LogIn size={16} />}
                <span className="text-sm font-light">
                  {user ? 'Logout' : 'Login / Sign Up'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
