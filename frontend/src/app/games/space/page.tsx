'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { gameApi } from '@/lib/api';
import Link from 'next/link';
import { Play, RotateCcw, Trophy } from 'lucide-react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PLAYER_SIZE = 40;
const BULLET_SIZE = 8;
const ENEMY_SIZE = 30;

type Entity = { x: number; y: number; width: number; height: number };
type Bullet = Entity & { active: boolean };
type Enemy = Entity & { active: boolean; speed: number };

export default function SpaceGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [player, setPlayer] = useState({ x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2, y: CANVAS_HEIGHT - 80 });
  const [bullets, setBullets] = useState<Bullet[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const { isAuthenticated } = useAuthStore();
  const keysRef = useRef<Set<string>>(new Set());
  const lastShotRef = useRef(0);

  const submitScore = useCallback(async () => {
    if (!isAuthenticated || score === 0) return;
    const duration = Math.floor((Date.now() - startTime) / 1000);
    try {
      await gameApi.submitScore({ game_type: 'space', raw_score: score, duration, level });
    } catch (err) {
      console.error('Failed to submit score:', err);
    }
  }, [isAuthenticated, score, level, startTime]);

  useEffect(() => {
    if (gameOver && score > 0) {
      if (score > highScore) setHighScore(score);
      submitScore();
    }
  }, [gameOver, score, highScore, submitScore]);

  const resetGame = useCallback(() => {
    setPlayer({ x: CANVAS_WIDTH / 2 - PLAYER_SIZE / 2, y: CANVAS_HEIGHT - 80 });
    setBullets([]);
    setEnemies([]);
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setIsPlaying(false);
  }, []);

  const spawnEnemy = useCallback(() => {
    const enemy: Enemy = {
      x: Math.random() * (CANVAS_WIDTH - ENEMY_SIZE),
      y: -ENEMY_SIZE,
      width: ENEMY_SIZE,
      height: ENEMY_SIZE,
      active: true,
      speed: 2 + level * 0.5,
    };
    setEnemies(prev => [...prev, enemy]);
  }, [level]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      if (e.key === ' ') e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => keysRef.current.delete(e.key);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const spawnInterval = setInterval(() => {
      spawnEnemy();
    }, Math.max(500, 1500 - level * 100));

    return () => clearInterval(spawnInterval);
  }, [isPlaying, gameOver, spawnEnemy, level]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameLoop = setInterval(() => {
      const keys = keysRef.current;
      const speed = 8;

      setPlayer(prev => {
        let newX = prev.x;
        if (keys.has('ArrowLeft') || keys.has('a')) newX -= speed;
        if (keys.has('ArrowRight') || keys.has('d')) newX += speed;
        newX = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_SIZE, newX));
        return { ...prev, x: newX };
      });

      if (keys.has(' ') && Date.now() - lastShotRef.current > 200) {
        lastShotRef.current = Date.now();
        setBullets(prev => [
          ...prev,
          {
            x: player.x + PLAYER_SIZE / 2 - BULLET_SIZE / 2,
            y: player.y - 10,
            width: BULLET_SIZE,
            height: 15,
            active: true,
          },
        ]);
      }

      setBullets(prev =>
        prev
          .map(b => ({ ...b, y: b.y - 10 }))
          .filter(b => b.y > -20 && b.active)
      );

      setEnemies(prev => {
        const updated = prev
          .map(e => ({ ...e, y: e.y + e.speed }))
          .filter(e => e.y < CANVAS_HEIGHT + 50 && e.active);

        for (const enemy of updated) {
          if (
            enemy.active &&
            player.x < enemy.x + enemy.width &&
            player.x + PLAYER_SIZE > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + PLAYER_SIZE > enemy.y
          ) {
            setGameOver(true);
            setIsPlaying(false);
            return prev;
          }
        }
        return updated;
      });

      setBullets(prevBullets => {
        setEnemies(prevEnemies => {
          const newEnemies = [...prevEnemies];
          const newBullets = prevBullets.map(b => ({ ...b }));

          for (let i = 0; i < newBullets.length; i++) {
            for (let j = 0; j < newEnemies.length; j++) {
              const b = newBullets[i];
              const e = newEnemies[j];
              if (
                b.active &&
                e.active &&
                b.x < e.x + e.width &&
                b.x + b.width > e.x &&
                b.y < e.y + e.height &&
                b.y + b.height > e.y
              ) {
                newBullets[i].active = false;
                newEnemies[j].active = false;
                setScore(s => {
                  const newScore = s + 2;
                  if (newScore % 100 === 0) setLevel(l => l + 1);
                  return newScore;
                });
              }
            }
          }

          return newEnemies.filter(e => e.active);
        });
        return prevBullets.filter(b => b.active);
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [isPlaying, gameOver, player]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (let i = 0; i < 50; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.5})`;
      ctx.fillRect(Math.random() * CANVAS_WIDTH, Math.random() * CANVAS_HEIGHT, 2, 2);
    }

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.moveTo(player.x + PLAYER_SIZE / 2, player.y);
    ctx.lineTo(player.x, player.y + PLAYER_SIZE);
    ctx.lineTo(player.x + PLAYER_SIZE, player.y + PLAYER_SIZE);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(player.x + PLAYER_SIZE / 2 - 3, player.y + PLAYER_SIZE, 6, 10);

    ctx.fillStyle = '#fbbf24';
    bullets.forEach(b => {
      ctx.beginPath();
      ctx.arc(b.x + b.width / 2, b.y + b.height / 2, b.width / 2, 0, Math.PI * 2);
      ctx.fill();
    });

    enemies.forEach(e => {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(e.x + e.width / 2, e.y + e.height);
      ctx.lineTo(e.x, e.y);
      ctx.lineTo(e.x + e.width, e.y);
      ctx.closePath();
      ctx.fill();
    });
  }, [player, bullets, enemies]);

  const startGame = () => {
    if (gameOver) resetGame();
    setIsPlaying(true);
    setStartTime(Date.now());
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">🚀 Space Shooter</h1>
            <p className="text-white/60 mt-1">Arrow keys to move, Space to shoot</p>
          </div>
          <Link href="/games" className="btn-secondary">Back to Games</Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="card-gradient rounded-2xl p-6">
              <canvas
                ref={canvasRef}
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                className="mx-auto rounded-lg border border-white/10"
              />
              
              <div className="flex justify-center gap-4 mt-6">
                {!isPlaying && !gameOver && (
                  <button onClick={startGame} className="btn-primary flex items-center gap-2">
                    <Play className="w-5 h-5" /> Start Game
                  </button>
                )}
                {!isPlaying && gameOver && (
                  <>
                    <button onClick={resetGame} className="btn-secondary flex items-center gap-2">
                      <RotateCcw className="w-5 h-5" /> Reset
                    </button>
                    <button onClick={startGame} className="btn-primary flex items-center gap-2">
                      <Play className="w-5 h-5" /> Play Again
                    </button>
                  </>
                )}
              </div>

              {gameOver && (
                <div className="mt-6 text-center">
                  <p className="text-2xl font-bold text-red-400">Game Over!</p>
                  <p className="text-white/60 mt-2">Final Score: {score}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-64">
            <div className="card-gradient rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-white/40 text-sm">Score</p>
                <p className="text-3xl font-bold text-primary">{score}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm">Level</p>
                <p className="text-2xl font-bold">{level}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm flex items-center gap-1">
                  <Trophy className="w-4 h-4" /> High Score
                </p>
                <p className="text-2xl font-bold text-accent">{highScore}</p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-white/40 text-sm mb-2">Multiplier</p>
                <p className="text-lg font-bold text-blue-400">1.5x (Medium)</p>
              </div>
            </div>
            
            {!isAuthenticated && (
              <div className="mt-4 card-gradient rounded-xl p-4 text-center">
                <p className="text-white/60 text-sm">Login to save your scores!</p>
                <Link href="/login" className="btn-primary mt-2 w-full block">Login</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
