package main

import (
	"log"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"hongphat-games/internal/database"
	"hongphat-games/internal/handlers"
	"hongphat-games/internal/middleware"
	ws "hongphat-games/internal/websocket"
)

func main() {
	database.GetDB()
	defer database.Close()

	hub := ws.NewHub()
	go hub.Run()

	r := gin.Default()

	// Apply general rate limiting
	r.Use(middleware.GeneralRateLimit())

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"*"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	authHandler := handlers.NewAuthHandler()
	gameHandler := handlers.NewGameHandler()
	messageHandler := handlers.NewMessageHandler(hub)
	wsHandler := handlers.NewWSHandler(hub)

	// Auth routes with stricter rate limiting
	authGroup := r.Group("/api/auth")
	authGroup.Use(middleware.AuthRateLimit())
	{
		authGroup.POST("/register", authHandler.Register)
		authGroup.POST("/login", authHandler.Login)
	}

	r.GET("/api/ranking", gameHandler.GetRanking)
	r.GET("/api/highscores", gameHandler.GetHighScores)
	r.GET("/api/difficulties", gameHandler.GetDifficulties)

	protected := r.Group("/api")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/me", authHandler.GetMe)
		protected.GET("/users/search", authHandler.SearchUsers)

		// Score submission with stricter rate limiting
		protected.POST("/scores", middleware.ScoreRateLimit(), gameHandler.SubmitScore)
		protected.GET("/scores/me", gameHandler.GetMyScores)

		protected.POST("/messages", messageHandler.SendMessage)
		protected.GET("/messages/inbox", messageHandler.GetInbox)
		protected.GET("/messages/conversation/:userId", messageHandler.GetConversation)
		protected.GET("/messages/unread", messageHandler.GetUnreadCount)

		protected.GET("/online", wsHandler.GetOnlineUsers)
	}

	r.GET("/ws", wsHandler.HandleWebSocket)

	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
