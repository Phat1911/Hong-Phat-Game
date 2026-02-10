package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
	"hongphat-games/internal/middleware"
	"hongphat-games/internal/models"
	"hongphat-games/internal/services"
)

type GameHandler struct {
	gameService *services.GameService
}

func NewGameHandler() *GameHandler {
	return &GameHandler{
		gameService: services.NewGameService(),
	}
}

func (h *GameHandler) SubmitScore(c *gin.Context) {
	userID := middleware.GetUserID(c)
	
	var req models.SubmitScoreRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if req.Level < 1 {
		req.Level = 1
	}

	// Server-side score validation
	if err := models.ValidateScoreRequest(req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid score: " + err.Error()})
		return
	}

	score, err := h.gameService.SubmitScore(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to submit score"})
		return
	}

	c.JSON(http.StatusCreated, score)
}

func (h *GameHandler) GetRanking(c *gin.Context) {
	gameType := c.Query("game_type")
	limitStr := c.DefaultQuery("limit", "50")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	rankings, err := h.gameService.GetRanking(gameType, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch rankings"})
		return
	}

	c.JSON(http.StatusOK, rankings)
}

func (h *GameHandler) GetMyScores(c *gin.Context) {
	userID := middleware.GetUserID(c)
	gameType := c.Query("game_type")

	scores, err := h.gameService.GetUserScores(userID, gameType)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch scores"})
		return
	}

	c.JSON(http.StatusOK, scores)
}

func (h *GameHandler) GetHighScores(c *gin.Context) {
	gameType := c.Query("game_type")
	limitStr := c.DefaultQuery("limit", "10")
	limit, _ := strconv.Atoi(limitStr)
	if limit <= 0 || limit > 50 {
		limit = 10
	}

	scores, err := h.gameService.GetHighScores(gameType, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch high scores"})
		return
	}

	c.JSON(http.StatusOK, scores)
}

func (h *GameHandler) GetDifficulties(c *gin.Context) {
	c.JSON(http.StatusOK, models.GameDifficulties)
}
