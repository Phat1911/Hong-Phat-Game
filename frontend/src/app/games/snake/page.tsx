'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { gameApi } from '@/lib/api';
import Link from 'next/link';
import { Play, Pause, RotateCcw, Trophy } from 'lucide-react';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SPEED = 150;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [startTime, setStartTime] = useState<number>(0);
  const { isAuthenticated } = useAuthStore();
  const directionRef = useRef(direction);

  const generateFood = useCallback((snakeBody: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakeBody.some(seg => seg.x === newFood.x && seg.y === newFood.y));
    return newFood;
  }, []);

  const resetGame = useCallback(() => {
    const initialSnake = [{ x: 10, y: 10 }];
    setSnake(initialSnake);
    setFood(generateFood(initialSnake));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setIsPlaying(false);
  }, [generateFood]);

  const submitScore = useCallback(async () => {
    if (!isAuthenticated || score === 0) return;
    const duration = Math.floor((Date.now() - startTime) / 1000);
    try {
      await gameApi.submitScore({
        game_type: 'snake',
        raw_score: score,
        duration,
        level,
      });
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPlaying) return;
      const key = e.key;
      const currentDir = directionRef.current;
      
      if ((key === 'ArrowUp' || key === 'w') && currentDir !== 'DOWN') {
        setDirection('UP');
        directionRef.current = 'UP';
      } else if ((key === 'ArrowDown' || key === 's') && currentDir !== 'UP') {
        setDirection('DOWN');
        directionRef.current = 'DOWN';
      } else if ((key === 'ArrowLeft' || key === 'a') && currentDir !== 'RIGHT') {
        setDirection('LEFT');
        directionRef.current = 'LEFT';
      } else if ((key === 'ArrowRight' || key === 'd') && currentDir !== 'LEFT') {
        setDirection('RIGHT');
        directionRef.current = 'RIGHT';
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const speed = Math.max(50, INITIAL_SPEED - (level - 1) * 10);
    const gameLoop = setInterval(() => {
      setSnake(prevSnake => {
        const head = { ...prevSnake[0] };
        const dir = directionRef.current;

        if (dir === 'UP') head.y -= 1;
        else if (dir === 'DOWN') head.y += 1;
        else if (dir === 'LEFT') head.x -= 1;
        else if (dir === 'RIGHT') head.x += 1;

        if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        if (prevSnake.some(seg => seg.x === head.x && seg.y === head.y)) {
          setGameOver(true);
          setIsPlaying(false);
          return prevSnake;
        }

        const newSnake = [head, ...prevSnake];

        if (head.x === food.x && head.y === food.y) {
          setScore(s => s + 10);
          setFood(generateFood(newSnake));
          if ((score + 10) % 50 === 0) {
            setLevel(l => l + 1);
          }
        } else {
          newSnake.pop();
        }

        return newSnake;
      });
    }, speed);

    return () => clearInterval(gameLoop);
  }, [isPlaying, gameOver, food, generateFood, level, score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#1e293b';
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(GRID_SIZE * CELL_SIZE, i * CELL_SIZE);
      ctx.stroke();
    }

    snake.forEach((segment, index) => {
      const gradient = ctx.createRadialGradient(
        segment.x * CELL_SIZE + CELL_SIZE / 2,
        segment.y * CELL_SIZE + CELL_SIZE / 2,
        0,
        segment.x * CELL_SIZE + CELL_SIZE / 2,
        segment.y * CELL_SIZE + CELL_SIZE / 2,
        CELL_SIZE / 2
      );
      gradient.addColorStop(0, index === 0 ? '#22c55e' : '#4ade80');
      gradient.addColorStop(1, index === 0 ? '#16a34a' : '#22c55e');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(segment.x * CELL_SIZE + 1, segment.y * CELL_SIZE + 1, CELL_SIZE - 2, CELL_SIZE - 2, 4);
      ctx.fill();
    });

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(food.x * CELL_SIZE + CELL_SIZE / 2, food.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
  }, [snake, food]);

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
            <h1 className="text-3xl font-bold flex items-center gap-3">
              🐍 Snake Game
            </h1>
            <p className="text-white/60 mt-1">Use arrow keys or WASD to control</p>
          </div>
          <Link href="/games" className="btn-secondary">Back to Games</Link>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1">
            <div className="card-gradient rounded-2xl p-6">
              <canvas
                ref={canvasRef}
                width={GRID_SIZE * CELL_SIZE}
                height={GRID_SIZE * CELL_SIZE}
                className="mx-auto rounded-lg border border-white/10"
              />
              
              <div className="flex justify-center gap-4 mt-6">
                {!isPlaying && !gameOver && (
                  <button onClick={startGame} className="btn-primary flex items-center gap-2">
                    <Play className="w-5 h-5" /> Start Game
                  </button>
                )}
                {isPlaying && (
                  <button onClick={() => setIsPlaying(false)} className="btn-secondary flex items-center gap-2">
                    <Pause className="w-5 h-5" /> Pause
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
                <p className="text-lg font-bold text-green-400">1.0x (Easy)</p>
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
