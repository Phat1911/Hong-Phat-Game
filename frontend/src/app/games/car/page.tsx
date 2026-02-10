'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { gameApi } from '@/lib/api';
import Link from 'next/link';
import { Play, RotateCcw, Trophy } from 'lucide-react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 50;
const PLAYER_HEIGHT = 30;
const CAR_WIDTH = 40;
const CAR_HEIGHT = 60;
const LANE_COUNT = 3;
const LANE_WIDTH = CANVAS_WIDTH / LANE_COUNT;

type Car = { x: number; y: number; lane: number; speed: number; color: string };

export default function CarGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playerLane, setPlayerLane] = useState(1);
  const [cars, setCars] = useState<Car[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [roadOffset, setRoadOffset] = useState(0);
  const { isAuthenticated } = useAuthStore();

  const playerX = playerLane * LANE_WIDTH + LANE_WIDTH / 2 - PLAYER_WIDTH / 2;
  const playerY = CANVAS_HEIGHT - 100;

  const carColors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6'];

  const submitScore = useCallback(async () => {
    if (!isAuthenticated || score === 0) return;
    const duration = Math.floor((Date.now() - startTime) / 1000);
    try {
      await gameApi.submitScore({ game_type: 'car', raw_score: Math.floor(score), duration, level });
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
    setPlayerLane(1);
    setCars([]);
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setIsPlaying(false);
    setRoadOffset(0);
  }, []);

  const spawnCar = useCallback(() => {
    const lane = Math.floor(Math.random() * LANE_COUNT);
    const car: Car = {
      x: lane * LANE_WIDTH + LANE_WIDTH / 2 - CAR_WIDTH / 2,
      y: -CAR_HEIGHT,
      lane,
      speed: 3 + level * 0.5 + Math.random() * 2,
      color: carColors[Math.floor(Math.random() * carColors.length)],
    };
    setCars(prev => [...prev, car]);
  }, [level]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      if (e.key === 'ArrowLeft' || e.key === 'a') {
        setPlayerLane(prev => Math.max(0, prev - 1));
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        setPlayerLane(prev => Math.min(LANE_COUNT - 1, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const spawnInterval = setInterval(() => {
      spawnCar();
    }, Math.max(400, 1200 - level * 80));

    return () => clearInterval(spawnInterval);
  }, [isPlaying, gameOver, spawnCar, level]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameLoop = setInterval(() => {
      setRoadOffset(prev => (prev + 10) % 40);
      setScore(s => {
        const newScore = s + 1;
        if (newScore % 100 === 0) setLevel(l => l + 1);
        return newScore;
      });

      setCars(prev => {
        const updated = prev.map(c => ({ ...c, y: c.y + c.speed })).filter(c => c.y < CANVAS_HEIGHT + 100);

        for (const car of updated) {
          const carCenterX = car.x + CAR_WIDTH / 2;
          const playerCenterX = playerX + PLAYER_WIDTH / 2;
          const carCenterY = car.y + CAR_HEIGHT / 2;
          const playerCenterY = playerY + PLAYER_HEIGHT / 2;

          if (
            Math.abs(carCenterX - playerCenterX) < (CAR_WIDTH + PLAYER_WIDTH) / 2 - 10 &&
            Math.abs(carCenterY - playerCenterY) < (CAR_HEIGHT + PLAYER_HEIGHT) / 2 - 5
          ) {
            setGameOver(true);
            setIsPlaying(false);
            return prev;
          }
        }
        return updated;
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [isPlaying, gameOver, playerX, playerY]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#374151';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#1f2937';
    ctx.fillRect(10, 0, CANVAS_WIDTH - 20, CANVAS_HEIGHT);

    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.setLineDash([20, 20]);
    for (let i = 1; i < LANE_COUNT; i++) {
      ctx.beginPath();
      ctx.moveTo(i * LANE_WIDTH, roadOffset - 40);
      ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(10, 0, 5, CANVAS_HEIGHT);
    ctx.fillRect(CANVAS_WIDTH - 15, 0, 5, CANVAS_HEIGHT);

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.roundRect(playerX, playerY, PLAYER_WIDTH, PLAYER_HEIGHT, 5);
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.fillRect(playerX + 5, playerY + 5, PLAYER_WIDTH - 10, 10);

    cars.forEach(car => {
      ctx.fillStyle = car.color;
      ctx.beginPath();
      ctx.roundRect(car.x, car.y, CAR_WIDTH, CAR_HEIGHT, 5);
      ctx.fill();
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(car.x + 5, car.y + 5, CAR_WIDTH - 10, 15);
      ctx.fillRect(car.x + 5, car.y + CAR_HEIGHT - 20, CAR_WIDTH - 10, 10);
    });
  }, [playerX, playerY, cars, roadOffset]);

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
            <h1 className="text-3xl font-bold flex items-center gap-3">🏎️ Car Racing</h1>
            <p className="text-white/60 mt-1">Left/Right arrows or A/D to change lanes</p>
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
                  <p className="text-2xl font-bold text-red-400">Crash!</p>
                  <p className="text-white/60 mt-2">Distance: {score}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-64">
            <div className="card-gradient rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-white/40 text-sm">Distance</p>
                <p className="text-3xl font-bold text-primary">{score}m</p>
              </div>
              <div>
                <p className="text-white/40 text-sm">Level</p>
                <p className="text-2xl font-bold">{level}</p>
              </div>
              <div>
                <p className="text-white/40 text-sm flex items-center gap-1">
                  <Trophy className="w-4 h-4" /> Best Distance
                </p>
                <p className="text-2xl font-bold text-accent">{highScore}m</p>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-white/40 text-sm mb-2">Multiplier</p>
                <p className="text-lg font-bold text-orange-400">1.3x (Medium)</p>
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
