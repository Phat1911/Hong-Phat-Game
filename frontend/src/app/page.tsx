import Link from 'next/link';
import { Gamepad2, Trophy, MessageCircle, Zap } from 'lucide-react';

const games = [
  { id: 'snake', name: 'Snake', emoji: '🐍', color: 'from-green-500 to-emerald-600', difficulty: 'Easy' },
  { id: 'space', name: 'Space Shooter', emoji: '🚀', color: 'from-blue-500 to-cyan-600', difficulty: 'Medium' },
  { id: 'car', name: 'Car Racing', emoji: '🏎️', color: 'from-red-500 to-orange-600', difficulty: 'Medium' },
  { id: 'flappy', name: 'Flappy Bird', emoji: '🐦', color: 'from-yellow-500 to-amber-600', difficulty: 'Hard' },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-6xl mx-auto text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 neon-text text-primary">
            Hong Phat Games
          </h1>
          <p className="text-xl md:text-2xl text-white/70 mb-8 max-w-2xl mx-auto">
            Play classic arcade games, compete with friends, and climb the global rankings!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/games" className="btn-primary text-lg px-8 py-3 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              Play Now
            </Link>
            <Link href="/ranking" className="btn-secondary text-lg px-8 py-3 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              View Rankings
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 flex items-center justify-center gap-3">
            <Zap className="w-8 h-8 text-accent" />
            Featured Games
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game) => (
              <Link
                key={game.id}
                href={`/games/${game.id}`}
                className="card-gradient rounded-2xl p-6 hover:scale-105 transition-all duration-300 group"
              >
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${game.color} flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform`}>
                  {game.emoji}
                </div>
                <h3 className="text-xl font-semibold mb-2">{game.name}</h3>
                <span className={`text-sm px-3 py-1 rounded-full ${
                  game.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400' :
                  game.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {game.difficulty}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4 bg-gradient-to-b from-transparent to-primary/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Play Here?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Global Rankings</h3>
              <p className="text-white/60">Compete with players worldwide and climb the leaderboard</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary/20 flex items-center justify-center">
                <Zap className="w-8 h-8 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Score Formula</h3>
              <p className="text-white/60">Harder games give higher scores - more risk, more reward!</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent/20 flex items-center justify-center">
                <MessageCircle className="w-8 h-8 text-accent" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Private Messages</h3>
              <p className="text-white/60">Chat with other players and make new friends</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
