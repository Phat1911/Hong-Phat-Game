# Hong Phat Games 🎮

A full-stack gaming platform with 4 classic arcade games, user authentication, real-time messaging, and global rankings.

**Live Demo**: https://orion-1770629073331-203.zinley.site

## Features

- 🐍 **Snake Game** - Classic snake, eat food, grow longer (1.0x multiplier)
- 🚀 **Space Shooter** - Defend Earth from aliens (1.5x multiplier)
- 🏎️ **Car Racing** - Dodge traffic at high speed (1.3x multiplier)
- 🐦 **Flappy Bird** - Tap to fly through pipes (2.0x multiplier - hardest!)
- 📊 **Global Rankings** - Compete with players worldwide
- 💬 **Private Messages** - Chat with other players via WebSocket
- 🔐 **JWT Authentication** - Secure login and registration

## Tech Stack

### Backend (Go)
- **Gin** - Fast HTTP web framework
- **Gorilla WebSocket** - Real-time communication
- **SQLite** - Embedded database (modernc.org/sqlite - pure Go)
- **JWT** - Token-based authentication
- **bcrypt** - Password hashing

### Frontend (Next.js/React)
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Zustand** - State management
- **Canvas API** - Game rendering

### Infrastructure
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration

## Score Formula

```
Final Score = Raw Score × Difficulty Multiplier × (1 + Time Bonus) × Level Multiplier
```

| Game | Difficulty | Base Multiplier | Time Bonus | Level Bonus |
|------|------------|-----------------|------------|-------------|
| Snake | Easy | 1.0x | 0.1 | 0.5 |
| Space | Medium | 1.5x | 0.15 | 0.8 |
| Car | Medium | 1.3x | 0.12 | 0.6 |
| Flappy | Hard | 2.0x | 0.2 | 1.0 |

## Getting Started

### Run Locally

1. **Backend**
```bash
cd backend
go mod tidy
go run ./cmd/server
# Server runs on http://localhost:8080
```

2. **Frontend**
```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

### Run with Docker

```bash
docker-compose up --build
# Backend: http://localhost:8080
# Frontend: http://localhost:3000
```

## API Endpoints

### Auth
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login

### Games
- `GET /api/ranking` - Get global rankings
- `GET /api/highscores` - Get high scores
- `POST /api/scores` - Submit score (auth required)

### Messages
- `GET /api/messages/inbox` - Get inbox (auth required)
- `POST /api/messages` - Send message (auth required)
- `GET /api/messages/conversation/:userId` - Get conversation (auth required)

### WebSocket
- `GET /ws?token=<jwt>` - Real-time messaging

## Project Structure

```
hongphat-games/
├── backend/
│   ├── cmd/server/main.go       # Entry point
│   ├── internal/
│   │   ├── handlers/            # HTTP handlers
│   │   ├── models/              # Data models
│   │   ├── services/            # Business logic
│   │   ├── middleware/          # Auth middleware
│   │   ├── database/            # SQLite setup
│   │   └── websocket/           # WebSocket hub
│   ├── Dockerfile
│   └── go.mod
├── frontend/
│   ├── src/
│   │   ├── app/                 # Next.js pages
│   │   ├── components/          # React components
│   │   └── lib/                 # Utilities
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
└── README.md
```

## License

MIT License - Built by Hong Phat
