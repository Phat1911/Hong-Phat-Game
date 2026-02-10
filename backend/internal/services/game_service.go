package services

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/google/uuid"
	"hongphat-games/internal/database"
	"hongphat-games/internal/models"
)

type GameService struct {
	db *sql.DB
}

func NewGameService() *GameService {
	return &GameService{db: database.GetDB()}
}

func (s *GameService) SubmitScore(userID string, req models.SubmitScoreRequest) (*models.GameScore, error) {
	finalScore := models.CalculateScore(req.GameType, req.RawScore, req.Duration, req.Level)

	var username string
	err := s.db.QueryRow("SELECT username FROM users WHERE id = $1", userID).Scan(&username)
	if err != nil {
		return nil, err
	}

	score := &models.GameScore{
		ID:         uuid.New().String(),
		UserID:     userID,
		Username:   username,
		GameType:   req.GameType,
		RawScore:   req.RawScore,
		FinalScore: finalScore,
		Duration:   req.Duration,
		Level:      req.Level,
		CreatedAt:  time.Now(),
	}

	_, err = s.db.Exec(
		"INSERT INTO game_scores (id, user_id, game_type, raw_score, final_score, duration, level, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
		score.ID, score.UserID, score.GameType, score.RawScore, score.FinalScore, score.Duration, score.Level, score.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return score, nil
}

func (s *GameService) GetRanking(gameType string, limit int) ([]models.RankingEntry, error) {
	var query string
	var args []interface{}
	
	if gameType != "" && gameType != "all" {
		query = `
			SELECT 
				u.id, u.username, u.avatar_url,
				COALESCE(SUM(gs.final_score), 0) as total_score,
				COUNT(gs.id) as games_count
			FROM users u
			LEFT JOIN game_scores gs ON u.id = gs.user_id AND gs.game_type = $1
			GROUP BY u.id
			ORDER BY total_score DESC
			LIMIT $2
		`
		args = []interface{}{gameType, limit}
	} else {
		query = `
			SELECT 
				u.id, u.username, u.avatar_url,
				COALESCE(SUM(gs.final_score), 0) as total_score,
				COUNT(gs.id) as games_count
			FROM users u
			LEFT JOIN game_scores gs ON u.id = gs.user_id
			GROUP BY u.id
			ORDER BY total_score DESC
			LIMIT $1
		`
		args = []interface{}{limit}
	}

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var rankings []models.RankingEntry
	rank := 1
	for rows.Next() {
		var entry models.RankingEntry
		if err := rows.Scan(&entry.UserID, &entry.Username, &entry.AvatarURL, &entry.TotalScore, &entry.GamesCount); err != nil {
			continue
		}
		entry.Rank = rank
		rankings = append(rankings, entry)
		rank++
	}
	return rankings, nil
}

func (s *GameService) GetUserScores(userID string, gameType string) ([]models.GameScore, error) {
	query := "SELECT id, user_id, game_type, raw_score, final_score, duration, level, created_at FROM game_scores WHERE user_id = $1"
	args := []interface{}{userID}
	argNum := 2

	if gameType != "" && gameType != "all" {
		query += fmt.Sprintf(" AND game_type = $%d", argNum)
		args = append(args, gameType)
	}
	query += " ORDER BY created_at DESC LIMIT 50"

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var scores []models.GameScore
	for rows.Next() {
		var score models.GameScore
		if err := rows.Scan(&score.ID, &score.UserID, &score.GameType, &score.RawScore, &score.FinalScore, &score.Duration, &score.Level, &score.CreatedAt); err != nil {
			continue
		}
		scores = append(scores, score)
	}
	return scores, nil
}

func (s *GameService) GetHighScores(gameType string, limit int) ([]models.GameScore, error) {
	query := `
		SELECT gs.id, gs.user_id, u.username, gs.game_type, gs.raw_score, gs.final_score, gs.duration, gs.level, gs.created_at
		FROM game_scores gs
		JOIN users u ON gs.user_id = u.id
	`
	args := []interface{}{}
	argNum := 1

	if gameType != "" && gameType != "all" {
		query += fmt.Sprintf(" WHERE gs.game_type = $%d", argNum)
		args = append(args, gameType)
		argNum++
	}

	query += fmt.Sprintf(" ORDER BY gs.final_score DESC LIMIT $%d", argNum)
	args = append(args, limit)

	rows, err := s.db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var scores []models.GameScore
	for rows.Next() {
		var score models.GameScore
		if err := rows.Scan(&score.ID, &score.UserID, &score.Username, &score.GameType, &score.RawScore, &score.FinalScore, &score.Duration, &score.Level, &score.CreatedAt); err != nil {
			continue
		}
		scores = append(scores, score)
	}
	return scores, nil
}
