'use client';
import { useState, useEffect } from 'react';
import { gameApi } from '@/lib/api';
import { Trophy, Medal, Search } from 'lucide-react';

type RankingEntry = {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string;
  total_score: number;
  games_count: number;
};

const gameTypes = [
  { id: '', name: 'All Games' },
  { id: 'snake', name: '🐍 Snake' },
  { id: 'space', name: '🚀 Space' },
  { id: 'car', name: '🏎️ Car' },
  { id: 'flappy_bird', name: '🐦 Flappy' },
];

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [selectedGame, setSelectedGame] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        const response = await gameApi.getRanking(selectedGame || undefined, 50);
        setRankings(response.data || []);
      } catch (err) {
        console.error('Failed to fetch rankings:', err);
        setRankings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, [selectedGame]);

  const filteredRankings = rankings.filter(entry =>
    entry.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
    if (rank === 2) return 'bg-gray-400/20 border-gray-400/50 text-gray-300';
    if (rank === 3) return 'bg-amber-700/20 border-amber-700/50 text-amber-500';
    return 'bg-white/5 border-white/10';
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-300" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-500" />;
    return <span className="w-6 h-6 flex items-center justify-center font-bold text-white/60">{rank}</span>;
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Trophy className="w-10 h-10 text-accent" />
            Global Rankings
          </h1>
          <p className="text-white/60 mt-2">See who's dominating the leaderboards</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-12"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {gameTypes.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`px-4 py-2 rounded-lg transition-all ${
                  selectedGame === game.id
                    ? 'bg-primary text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                }`}
              >
                {game.name}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-white/60 mt-4">Loading rankings...</p>
          </div>
        ) : filteredRankings.length === 0 ? (
          <div className="text-center py-12 card-gradient rounded-2xl">
            <p className="text-white/60">No rankings found</p>
            <p className="text-white/40 text-sm mt-2">Be the first to play and get on the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRankings.map((entry, index) => (
              <div
                key={entry.user_id}
                className={`flex items-center gap-4 p-4 rounded-xl border ${getRankStyle(entry.rank)} transition-all hover:scale-[1.01]`}
              >
                <div className="w-12 h-12 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xl font-bold">
                  {entry.username.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-lg">{entry.username}</p>
                  <p className="text-white/40 text-sm">{entry.games_count} games played</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{Math.round(entry.total_score).toLocaleString()}</p>
                  <p className="text-white/40 text-sm">points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
