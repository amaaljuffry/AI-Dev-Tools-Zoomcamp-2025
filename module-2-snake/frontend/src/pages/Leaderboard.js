import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard?limit=50`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }
      
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Unable to load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-yellow-500" size={24} />;
      case 2:
        return <Medal className="text-gray-400" size={24} />;
      case 3:
        return <Award className="text-amber-700" size={24} />;
      default:
        return <span className="text-lg font-mono w-6 text-center">{rank}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-light tracking-tight text-black mb-2">
            Leaderboard
          </h1>
          <p className="text-sm text-black opacity-60">
            Top players and their high scores
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-black border-r-transparent"></div>
            <p className="mt-4 text-sm font-light text-black">Loading leaderboard...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center justify-between p-4 border border-black transition-colors duration-200 ${
                  entry.rank <= 3
                    ? 'bg-black text-white hover:bg-white hover:text-black'
                    : 'bg-white hover:bg-black hover:text-white'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 flex justify-center">
                    {getRankIcon(entry.rank)}
                  </div>
                  <span className="text-lg font-light">{entry.username}</span>
                </div>
                <div className="text-xl font-mono">
                  {entry.score.toString().padStart(3, '0')}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && leaderboard.length === 0 && (
          <div className="text-center py-12 border border-black">
            <Trophy className="mx-auto mb-4 opacity-30" size={48} />
            <p className="text-lg font-light text-black mb-2">No scores yet</p>
            <p className="text-sm font-light text-black opacity-60">
              Be the first to play and get on the leaderboard!
            </p>
          </div>
        )}

        {error && (
          <div className="text-center py-12 border border-red-500">
            <p className="text-sm font-light text-red-500 mb-4">{error}</p>
            <button
              onClick={fetchLeaderboard}
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
