import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const storage = localStorage.getItem('auth-storage');
    if (storage) {
      const { state } = JSON.parse(storage);
      if (state?.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
  }
  return config;
});

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/api/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/api/auth/login', data),
  getMe: () => api.get('/api/me'),
};

export const gameApi = {
  submitScore: (data: { game_type: string; raw_score: number; duration: number; level: number }) =>
    api.post('/api/scores', data),
  getMyScores: (gameType?: string) =>
    api.get('/api/scores/me', { params: { game_type: gameType } }),
  getRanking: (gameType?: string, limit = 50) =>
    api.get('/api/ranking', { params: { game_type: gameType, limit } }),
  getHighScores: (gameType?: string, limit = 10) =>
    api.get('/api/highscores', { params: { game_type: gameType, limit } }),
  getDifficulties: () => api.get('/api/difficulties'),
};

export const userApi = {
  search: (query: string) =>
    api.get('/api/users/search', { params: { q: query } }),
};

export const messageApi = {
  send: (data: { receiver_id: string; content: string }) =>
    api.post('/api/messages', data),
  getInbox: () => api.get('/api/messages/inbox'),
  getConversation: (userId: string) =>
    api.get(`/api/messages/conversation/${userId}`),
  getUnreadCount: () => api.get('/api/messages/unread'),
};

export default api;
