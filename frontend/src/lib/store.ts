import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'auth-storage' }
  )
);

interface GameState {
  currentGame: string | null;
  score: number;
  level: number;
  isPlaying: boolean;
  setGame: (game: string | null) => void;
  setScore: (score: number) => void;
  addScore: (points: number) => void;
  setLevel: (level: number) => void;
  startGame: () => void;
  endGame: () => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  currentGame: null,
  score: 0,
  level: 1,
  isPlaying: false,
  setGame: (game) => set({ currentGame: game }),
  setScore: (score) => set({ score }),
  addScore: (points) => set((state) => ({ score: state.score + points })),
  setLevel: (level) => set({ level }),
  startGame: () => set({ isPlaying: true, score: 0, level: 1 }),
  endGame: () => set({ isPlaying: false }),
  resetGame: () => set({ score: 0, level: 1, isPlaying: false }),
}));
