package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"hongphat-games/internal/middleware"
	"hongphat-games/internal/models"
	"hongphat-games/internal/services"
	ws "hongphat-games/internal/websocket"
)

type MessageHandler struct {
	messageService *services.MessageService
	hub            *ws.Hub
}

func NewMessageHandler(hub *ws.Hub) *MessageHandler {
	return &MessageHandler{
		messageService: services.NewMessageService(),
		hub:            hub,
	}
}

func (h *MessageHandler) SendMessage(c *gin.Context) {
	userID := middleware.GetUserID(c)

	var req models.SendMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	message, err := h.messageService.SendMessage(userID, req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send message"})
		return
	}

	h.hub.SendPrivateMessage(&ws.PrivateMessage{
		SenderID:   userID,
		ReceiverID: req.ReceiverID,
		Content:    req.Content,
		Type:       "private_message",
	})

	c.JSON(http.StatusCreated, message)
}

func (h *MessageHandler) GetConversation(c *gin.Context) {
	userID := middleware.GetUserID(c)
	otherUserID := c.Param("userId")

	messages, err := h.messageService.GetConversation(userID, otherUserID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch conversation"})
		return
	}

	h.messageService.MarkAsRead(userID, otherUserID)

	c.JSON(http.StatusOK, messages)
}

func (h *MessageHandler) GetInbox(c *gin.Context) {
	userID := middleware.GetUserID(c)

	messages, err := h.messageService.GetInbox(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch inbox"})
		return
	}

	c.JSON(http.StatusOK, messages)
}

func (h *MessageHandler) GetUnreadCount(c *gin.Context) {
	userID := middleware.GetUserID(c)

	count, err := h.messageService.GetUnreadCount(userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get unread count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"count": count})
}
