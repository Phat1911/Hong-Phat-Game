package services

import (
	"database/sql"
	"time"

	"github.com/google/uuid"
	"hongphat-games/internal/database"
	"hongphat-games/internal/models"
)

type MessageService struct {
	db *sql.DB
}

func NewMessageService() *MessageService {
	return &MessageService{db: database.GetDB()}
}

func (s *MessageService) SendMessage(senderID string, req models.SendMessageRequest) (*models.Message, error) {
	message := &models.Message{
		ID:         uuid.New().String(),
		SenderID:   senderID,
		ReceiverID: req.ReceiverID,
		Content:    req.Content,
		Read:       false,
		CreatedAt:  time.Now(),
	}

	_, err := s.db.Exec(
		"INSERT INTO messages (id, sender_id, receiver_id, content, read, created_at) VALUES ($1, $2, $3, $4, $5, $6)",
		message.ID, message.SenderID, message.ReceiverID, message.Content, 0, message.CreatedAt,
	)
	if err != nil {
		return nil, err
	}
	return message, nil
}

func (s *MessageService) GetConversation(userID, otherUserID string) ([]models.Message, error) {
	rows, err := s.db.Query(`
		SELECT id, sender_id, receiver_id, content, read, created_at 
		FROM messages 
		WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $3 AND receiver_id = $4)
		ORDER BY created_at ASC
		LIMIT 100
	`, userID, otherUserID, otherUserID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		var readInt int
		if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &readInt, &msg.CreatedAt); err != nil {
			continue
		}
		msg.Read = readInt == 1
		messages = append(messages, msg)
	}
	return messages, nil
}

func (s *MessageService) GetInbox(userID string) ([]models.Message, error) {
	rows, err := s.db.Query(`
		SELECT DISTINCT m.id, m.sender_id, m.receiver_id, m.content, m.read, m.created_at
		FROM messages m
		INNER JOIN (
			SELECT 
				CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END as other_user,
				MAX(created_at) as max_created
			FROM messages
			WHERE sender_id = $2 OR receiver_id = $3
			GROUP BY other_user
		) latest ON (
			((m.sender_id = $4 AND m.receiver_id = latest.other_user) OR 
			 (m.receiver_id = $5 AND m.sender_id = latest.other_user))
			AND m.created_at = latest.max_created
		)
		ORDER BY m.created_at DESC
		LIMIT 50
	`, userID, userID, userID, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []models.Message
	for rows.Next() {
		var msg models.Message
		var readInt int
		if err := rows.Scan(&msg.ID, &msg.SenderID, &msg.ReceiverID, &msg.Content, &readInt, &msg.CreatedAt); err != nil {
			continue
		}
		msg.Read = readInt == 1
		messages = append(messages, msg)
	}
	return messages, nil
}

func (s *MessageService) MarkAsRead(userID, senderID string) error {
	_, err := s.db.Exec(
		"UPDATE messages SET read = 1 WHERE receiver_id = $1 AND sender_id = $2 AND read = 0",
		userID, senderID,
	)
	return err
}

func (s *MessageService) GetUnreadCount(userID string) (int, error) {
	var count int
	err := s.db.QueryRow("SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND read = 0", userID).Scan(&count)
	return count, err
}
