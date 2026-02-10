'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '@/lib/store';
import { gameApi } from '@/lib/api';
import Link from 'next/link';
import { Play, RotateCcw, Trophy } from 'lucide-react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 600;
const BIRD_SIZE = 30;
const PIPE_WIDTH = 60;
const PIPE_GAP = 150;
const GRAVITY = 0.5;
const JUMP_FORCE = -8;

type Pipe = { x: number; topHeight: number; passed: boolean };

export default function FlappyGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [birdY, setBirdY] = useState(CANVAS_HEIGHT / 2);
  const [birdVelocity, setBirdVelocity] = useState(0);
  const [pipes, setPipes] = useState<Pipe[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const { isAuthenticated } = useAuthStore();

  const birdX = 80;

  const submitScore = useCallback(async () => {
    if (!isAuthenticated || score === 0) return;
    const duration = Math.floor((Date.now() - startTime) / 1000);
    try {
      await gameApi.submitScore({ game_type: 'flappy_bird', raw_score: score, duration, level });
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
    setBirdY(CANVAS_HEIGHT / 2);
    setBirdVelocity(0);
    setPipes([]);
    setScore(0);
    setLevel(1);
    setGameOver(false);
    setIsPlaying(false);
  }, []);

  const jump = useCallback(() => {
    if (!isPlaying || gameOver) return;
    setBirdVelocity(JUMP_FORCE);
  }, [isPlaying, gameOver]);

  const spawnPipe = useCallback(() => {
    const minHeight = 50;
    const maxHeight = CANVAS_HEIGHT - PIPE_GAP - minHeight;
    const topHeight = Math.random() * (maxHeight - minHeight) + minHeight;
    const pipe: Pipe = {
      x: CANVAS_WIDTH,
      topHeight,
      passed: false,
    };
    setPipes(prev => [...prev, pipe]);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        jump();
      }
    };
    const handleClick = () => jump();

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClick);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClick);
    };
  }, [jump]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const spawnInterval = setInterval(() => {
      spawnPipe();
    }, Math.max(1200, 2000 - level * 100));

    return () => clearInterval(spawnInterval);
  }, [isPlaying, gameOver, spawnPipe, level]);

  useEffect(() => {
    if (!isPlaying || gameOver) return;

    const gameLoop = setInterval(() => {
      setBirdY(prev => {
        const newY = prev + birdVelocity;
        if (newY < 0 || newY + BIRD_SIZE > CANVAS_HEIGHT) {
          setGameOver(true);
          setIsPlaying(false);
          return prev;
        }
        return newY;
      });

      setBirdVelocity(prev => prev + GRAVITY);

      const pipeSpeed = 3 + level * 0.3;
      setPipes(prev => {
        const updated = prev
          .map(p => ({ ...p, x: p.x - pipeSpeed }))
          .filter(p => p.x > -PIPE_WIDTH);

        for (const pipe of updated) {
          if (
            birdX + BIRD_SIZE > pipe.x &&
            birdX < pipe.x + PIPE_WIDTH
          ) {
            if (birdY < pipe.topHeight || birdY + BIRD_SIZE > pipe.topHeight + PIPE_GAP) {
              setGameOver(true);
              setIsPlaying(false);
              return prev;
            }
          }

          if (!pipe.passed && pipe.x + PIPE_WIDTH < birdX) {
            pipe.passed = true;
            setScore(s => {
              const newScore = s + 1;
              if (newScore % 5 === 0) setLevel(l => l + 1);
              return newScore;
            });
          }
        }

        return updated;
      });
    }, 1000 / 60);

    return () => clearInterval(gameLoop);
  }, [isPlaying, gameOver, birdVelocity, birdY, level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#87ceeb');
    gradient.addColorStop(1, '#98d8c8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#8b4513';
    ctx.fillRect(0, CANVAS_HEIGHT - 20, CANVAS_WIDTH, 20);
    ctx.fillStyle = '#228b22';
    ctx.fillRect(0, CANVAS_HEIGHT - 30, CANVAS_WIDTH, 10);

    pipes.forEach(pipe => {
      const pipeGradient = ctx.createLinearGradient(pipe.x, 0, pipe.x + PIPE_WIDTH, 0);
      pipeGradient.addColorStop(0, '#2d8f2d');
      pipeGradient.addColorStop(0.5, '#3cb043');
      pipeGradient.addColorStop(1, '#2d8f2d');
      ctx.fillStyle = pipeGradient;
      
      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
      ctx.fillRect(pipe.x - 5, pipe.topHeight - 20, PIPE_WIDTH + 10, 20);
      
      ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, CANVAS_HEIGHT - pipe.topHeight - PIPE_GAP);
      ctx.fillRect(pipe.x - 5, pipe.topHeight + PIPE_GAP, PIPE_WIDTH + 10, 20);
    });

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(birdX + BIRD_SIZE / 2, birdY + BIRD_SIZE / 2, BIRD_SIZE / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(birdX + BIRD_SIZE / 2 + 5, birdY + BIRD_SIZE / 2 - 3, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(birdX + BIRD_SIZE / 2 + 7, birdY + BIRD_SIZE / 2 - 3, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(birdX + BIRD_SIZE, birdY + BIRD_SIZE / 2);
    ctx.lineTo(birdX + BIRD_SIZE + 10, birdY + BIRD_SIZE / 2 + 3);
    ctx.lineTo(birdX + BIRD_SIZE, birdY + BIRD_SIZE / 2 + 6);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(birdX, birdY + BIRD_SIZE / 2);
    ctx.lineTo(birdX - 8, birdY + BIRD_SIZE / 2 - 5 + Math.sin(Date.now() / 50) * 3);
    ctx.lineTo(birdX, birdY + BIRD_SIZE / 2 + 5);
    ctx.closePath();
    ctx.fill();
  }, [birdY, pipes]);

  const startGame = () => {
    if (gameOver) resetGame();
    setIsPlaying(true);
    setStartTime(Date.now());
    setBirdVelocity(JUMP_FORCE);
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">🐦 Flappy Bird</h1>
            <p className="text-white/60 mt-1">Click, Space, or Up arrow to fly</p>
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
                className="mx-auto rounded-lg border border-white/10 cursor-pointer"
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
                  <p className="text-white/60 mt-2">Pipes Passed: {score}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-64">
            <div className="card-gradient rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-white/40 text-sm">Pipes Passed</p>
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
                <p className="text-lg font-bold text-red-400">2.0x (Hard)</p>
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
