'use client';
import Link from 'next/link';

const games = [
  { id: 'snake', name: 'Snake', emoji: '🐍', color: 'from-green-500 to-emerald-600', difficulty: 'Easy', multiplier: '1.0x', description: 'Classic snake game - eat food and grow longer without hitting walls or yourself!' },
  { id: 'space', name: 'Space Shooter', emoji: '🚀', color: 'from-blue-500 to-cyan-600', difficulty: 'Medium', multiplier: '1.5x', description: 'Defend Earth from alien invaders - shoot them down before they reach you!' },
  { id: 'car', name: 'Car Racing', emoji: '🏎️', color: 'from-red-500 to-orange-600', difficulty: 'Easy', multiplier: '0.0x', description: 'Race through traffic at high speed - dodge cars and collect bonuses!' },
  { id: 'flappy', name: 'Flappy Bird', emoji: '🐦', color: 'from-yellow-500 to-amber-600', difficulty: 'Hard', multiplier: '2.0x', description: 'Tap to fly through pipes - simple controls but extremely challenging!' },
];

export default function GamesPage() {
  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Choose Your Game</h1>
        <p className="text-center text-white/60 mb-12">Each game has different difficulty and score multipliers</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {games.map((game) => (
            <Link
              key={game.id}
              href={`/games/${game.id}`}
              className="card-gradient rounded-2xl p-8 hover:scale-[1.02] transition-all duration-300 group"
            >
              <div className="flex items-start gap-6">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${game.color} flex items-center justify-center text-4xl group-hover:scale-110 transition-transform shrink-0`}>
                  {game.emoji}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{game.name}</h2>
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      game.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                      game.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {game.difficulty}
                    </span>
                  </div>
                  <p className="text-white/60 mb-4">{game.description}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white/40">Score Multiplier:</span>
                    <span className="text-lg font-bold text-accent">{game.multiplier}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12 card-gradient rounded-2xl p-8">
          <h3 className="text-xl font-bold mb-4">Score Formula</h3>
          <p className="text-white/60 mb-4">Your final score is calculated based on:</p>
          <code className="block bg-black/30 p-4 rounded-lg text-sm">
            Final Score = Raw Score × Difficulty Multiplier × (1 + Time Bonus) × Level Multiplier
          </code>
          <p className="text-white/40 text-sm mt-4">
            Harder games have higher multipliers. Play longer and reach higher levels for bonus points!
          </p>
        </div>
      </div>
    </div>
  );
}
