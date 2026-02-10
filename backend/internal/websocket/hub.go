package websocket

import (
	"encoding/json"
	"log"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

type Client struct {
	ID       string
	UserID   string
	Username string
	Conn     *websocket.Conn
	Send     chan []byte
	Hub      *Hub
}

type Hub struct {
	clients    map[string]*Client
	register   chan *Client
	unregister chan *Client
	broadcast  chan []byte
	private    chan *PrivateMessage
	mu         sync.RWMutex
	// deadClients tracks clients that failed to receive messages
	deadClients chan string
}

type PrivateMessage struct {
	SenderID   string `json:"sender_id"`
	ReceiverID string `json:"receiver_id"`
	Content    string `json:"content"`
	Type       string `json:"type"`
	Timestamp  int64  `json:"timestamp"`
}

type WSMessage struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

func NewHub() *Hub {
	h := &Hub{
		clients:     make(map[string]*Client),
		register:    make(chan *Client),
		unregister:  make(chan *Client),
		broadcast:   make(chan []byte),
		private:     make(chan *PrivateMessage, 256),
		deadClients: make(chan string, 256),
	}
	return h
}

func (h *Hub) Run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client.UserID] = client
			h.mu.Unlock()
			log.Printf("Client connected: %s (%s)", client.Username, client.UserID)

		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client.UserID]; ok {
				delete(h.clients, client.UserID)
				close(client.Send)
			}
			h.mu.Unlock()
			log.Printf("Client disconnected: %s (%s)", client.Username, client.UserID)

		case deadUserID := <-h.deadClients:
			// Handle dead clients safely with write lock
			h.mu.Lock()
			if client, ok := h.clients[deadUserID]; ok {
				delete(h.clients, deadUserID)
				close(client.Send)
				log.Printf("Dead client removed: %s", deadUserID)
			}
			h.mu.Unlock()

		case message := <-h.broadcast:
			// Collect dead clients without modifying map under RLock
			h.mu.RLock()
			for _, client := range h.clients {
				select {
				case client.Send <- message:
				default:
					// Queue for removal instead of modifying under RLock
					select {
					case h.deadClients <- client.UserID:
					default:
						// Channel full, skip
					}
				}
			}
			h.mu.RUnlock()

		case pm := <-h.private:
			h.mu.RLock()
			if client, ok := h.clients[pm.ReceiverID]; ok {
				msg, _ := json.Marshal(map[string]interface{}{
					"type":       "private_message",
					"sender_id":  pm.SenderID,
					"content":    pm.Content,
					"timestamp":  pm.Timestamp,
				})
				select {
				case client.Send <- msg:
				default:
					// Queue for removal
					select {
					case h.deadClients <- client.UserID:
					default:
					}
				}
			}
			h.mu.RUnlock()
		}
	}
}

func (h *Hub) SendPrivateMessage(pm *PrivateMessage) {
	pm.Timestamp = time.Now().UnixMilli()
	h.private <- pm
}

func (h *Hub) Register(client *Client) {
	h.register <- client
}

func (h *Hub) Unregister(client *Client) {
	h.unregister <- client
}

func (h *Hub) Broadcast(message []byte) {
	h.broadcast <- message
}

func (h *Hub) IsOnline(userID string) bool {
	h.mu.RLock()
	defer h.mu.RUnlock()
	_, ok := h.clients[userID]
	return ok
}

func (h *Hub) GetOnlineUsers() []string {
	h.mu.RLock()
	defer h.mu.RUnlock()
	users := make([]string, 0, len(h.clients))
	for userID := range h.clients {
		users = append(users, userID)
	}
	return users
}

func (c *Client) ReadPump() {
	defer func() {
		c.Hub.Unregister(c)
		c.Conn.Close()
	}()

	c.Conn.SetReadLimit(512 * 1024)
	c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
	c.Conn.SetPongHandler(func(string) error {
		c.Conn.SetReadDeadline(time.Now().Add(60 * time.Second))
		return nil
	})

	for {
		_, message, err := c.Conn.ReadMessage()
		if err != nil {
			break
		}

		var wsMsg WSMessage
		if err := json.Unmarshal(message, &wsMsg); err != nil {
			continue
		}

		switch wsMsg.Type {
		case "private_message":
			var pm PrivateMessage
			if err := json.Unmarshal(wsMsg.Payload, &pm); err == nil {
				pm.SenderID = c.UserID
				pm.Type = "private_message"
				c.Hub.SendPrivateMessage(&pm)
			}
		case "ping":
			pong, _ := json.Marshal(map[string]string{"type": "pong"})
			c.Send <- pong
		}
	}
}

func (c *Client) WritePump() {
	ticker := time.NewTicker(30 * time.Second)
	defer func() {
		ticker.Stop()
		c.Conn.Close()
	}()

	for {
		select {
		case message, ok := <-c.Send:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if !ok {
				c.Conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}

			w, err := c.Conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)
			w.Close()

		case <-ticker.C:
			c.Conn.SetWriteDeadline(time.Now().Add(10 * time.Second))
			if err := c.Conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
