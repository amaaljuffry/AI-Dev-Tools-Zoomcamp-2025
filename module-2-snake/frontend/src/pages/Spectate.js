import React, { useState, useEffect, useCallback } from 'react';
import { Eye, Users, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Spectate() {
  const [activeGames, setActiveGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchActiveGames = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/game/active`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch active games');
      }
      
      const data = await response.json();
      // Transform data to match component expectations
      const games = data.map(game => ({
        id: game.id,
        player: game.username || 'Anonymous',
        score: game.score || 0,
        spectators: game.spectators || 0,
        duration: formatDuration(game.duration || 0)
      }));
      setActiveGames(games);
    } catch (err) {
      console.error('Error fetching active games:', err);
      setError('Unable to load active games. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveGames();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchActiveGames, 5000);

    return () => clearInterval(interval);
  }, [fetchActiveGames]);

  const handleSpectate = (gameId) => {
    // TODO: Implement WebSocket connection to spectate game
    console.log('Spectating game:', gameId);
    alert('Spectate feature coming soon! This will connect you to watch the game in real-time.');
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-tight text-black mb-2">
            Spectate Games
          </h1>
          <p className="text-sm text-black opacity-60">
            Watch other players in real-time
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-r-transparent"></div>
            <p className="mt-4 text-sm font-light text-black">Loading active games...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {activeGames.map((game) => (
              <div
                key={game.id}
                className="border border-black p-6 hover:bg-black hover:text-white transition-colors duration-200 cursor-pointer"
                onClick={() => handleSpectate(game.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-light mb-1">{game.player}</h3>
                    <p className="text-sm opacity-60">Playing for {game.duration}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono mb-1">
                      {game.score.toString().padStart(3, '0')}
                    </div>
                    <div className="text-xs opacity-60">SCORE</div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-current opacity-60">
                  <div className="flex items-center gap-2">
                    <Users size={16} />
                    <span className="text-sm font-light">
                      {game.spectators} watching
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye size={16} />
                    <span className="text-sm font-light">Watch</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && activeGames.length === 0 && (
          <div className="text-center py-12 border border-black">
            <Eye className="mx-auto mb-4 opacity-30" size={48} />
            <p className="text-lg font-light text-black mb-2">No active games</p>
            <p className="text-sm text-black opacity-60">
              Start a game to let others spectate!
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 border border-red-500">
            <p className="text-sm font-light text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchActiveGames}
              className="inline-flex items-center gap-2 px-4 py-2 border border-black hover:bg-black hover:text-white transition-colors"
            >
              <RefreshCw size={16} />
              <span className="text-sm font-light">Retry</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
