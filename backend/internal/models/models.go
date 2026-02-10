package models

import (
	"fmt"
	"time"
)

type User struct {
	ID        string    `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Password  string    `json:"-"`
	AvatarURL string    `json:"avatar_url"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type GameType string

const (
	GameSnake      GameType = "snake"
	GameSpace      GameType = "space"
	GameCar        GameType = "car"
	GameFlappyBird GameType = "flappy_bird"
)

type GameScore struct {
	ID         string    `json:"id"`
	UserID     string    `json:"user_id"`
	Username   string    `json:"username"`
	GameType   GameType  `json:"game_type"`
	RawScore   int       `json:"raw_score"`
	FinalScore float64   `json:"final_score"`
	Duration   int       `json:"duration"`
	Level      int       `json:"level"`
	CreatedAt  time.Time `json:"created_at"`
}

type Message struct {
	ID         string    `json:"id"`
	SenderID   string    `json:"sender_id"`
	ReceiverID string    `json:"receiver_id"`
	Content    string    `json:"content"`
	Read       bool      `json:"read"`
	CreatedAt  time.Time `json:"created_at"`
}

type RankingEntry struct {
	Rank       int     `json:"rank"`
	UserID     string  `json:"user_id"`
	Username   string  `json:"username"`
	AvatarURL  string  `json:"avatar_url"`
	TotalScore float64 `json:"total_score"`
	GamesCount int     `json:"games_count"`
}

type GameDifficulty struct {
	BaseMultiplier float64
	TimeBonus      float64
	LevelBonus     float64
}

var GameDifficulties = map[GameType]GameDifficulty{
	GameSnake: {
		BaseMultiplier: 1.0,
		TimeBonus:      0.1,
		LevelBonus:     0.5,
	},
	GameSpace: {
		BaseMultiplier: 1.5,
		TimeBonus:      0.15,
		LevelBonus:     0.8,
	},
	GameCar: {
		BaseMultiplier: 1.3,
		TimeBonus:      0.12,
		LevelBonus:     0.6,
	},
	GameFlappyBird: {
		BaseMultiplier: 2.0,
		TimeBonus:      0.2,
		LevelBonus:     1.0,
	},
}

func CalculateScore(gameType GameType, rawScore int, duration int, level int) float64 {
	difficulty, exists := GameDifficulties[gameType]
	if !exists {
		return float64(rawScore)
	}
	
	// Car Racing: score / 100 * value (where value = level * BaseMultiplier)
	if gameType == GameCar {
		value := float64(level) * difficulty.BaseMultiplier
		return float64(rawScore) / 100.0 * value
	}
	
	// Other games: original formula
	baseScore := float64(rawScore) * difficulty.BaseMultiplier
	timeMultiplier := 1.0 + (difficulty.TimeBonus * float64(duration/60))
	levelMultiplier := 1.0 + (difficulty.LevelBonus * float64(level-1))
	return baseScore + timeMultiplier + levelMultiplier
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=20"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type SubmitScoreRequest struct {
	GameType GameType `json:"game_type" binding:"required"`
	RawScore int      `json:"raw_score" binding:"min=0,max=100000"`
	Duration int      `json:"duration" binding:"min=0,max=3600"`
	Level    int      `json:"level" binding:"min=0,max=100"`
}

type GameLimits struct {
	MaxRawScore      int
	MaxScorePerMinute int
	MaxLevel         int
	MaxDuration      int
}

var GameScoreLimits = map[GameType]GameLimits{
	GameSnake: {
		MaxRawScore:       10000,
		MaxScorePerMinute: 600,
		MaxLevel:          50,
		MaxDuration:       1800,
	},
	GameSpace: {
		MaxRawScore:       50000,
		MaxScorePerMinute: 2000,
		MaxLevel:          100,
		MaxDuration:       3600,
	},
	GameCar: {
		MaxRawScore:       30000,
		MaxScorePerMinute: 6000,
		MaxLevel:          75,
		MaxDuration:       2400,
	},
	GameFlappyBird: {
		MaxRawScore:       5000,
		MaxScorePerMinute: 300,
		MaxLevel:          100,
		MaxDuration:       1200,
	},
}

func ValidateScoreRequest(req SubmitScoreRequest) error {
	limits, exists := GameScoreLimits[req.GameType]
	if !exists {
		return fmt.Errorf("invalid game type")
	}
	
	if req.RawScore > limits.MaxRawScore {
		return fmt.Errorf("score exceeds maximum for this game")
	}
	
	if req.Duration > limits.MaxDuration {
		return fmt.Errorf("duration exceeds maximum for this game")
	}
	
	if req.Level > limits.MaxLevel {
		return fmt.Errorf("level exceeds maximum for this game")
	}
	
	if req.Duration > 0 {
		scorePerMinute := float64(req.RawScore) / (float64(req.Duration) / 60.0)
		if scorePerMinute > float64(limits.MaxScorePerMinute)*1.5 {
			return fmt.Errorf("score rate exceeds plausible maximum")
		}
	}
	
	return nil
}

type SendMessageRequest struct {
	ReceiverID string `json:"receiver_id" binding:"required"`
	Content    string `json:"content" binding:"required,max=1000"`
}

type SearchUserRequest struct {
	Query string `json:"query" binding:"required,min=1"`
}
