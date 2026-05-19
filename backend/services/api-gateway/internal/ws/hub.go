package ws

import (
	"encoding/json"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool { return true },
}

// Event is a message sent to all connected clients.
type Event struct {
	Type      string      `json:"type"`      // "incident", "remediation", "metric", "guardian"
	Payload   interface{} `json:"payload"`
	Timestamp string      `json:"timestamp"`
}

// Hub manages WebSocket connections and broadcasts events.
type Hub struct {
	clients map[*websocket.Conn]bool
	mu      sync.RWMutex
}

// NewHub creates a new WebSocket hub.
func NewHub() *Hub {
	return &Hub{
		clients: make(map[*websocket.Conn]bool),
	}
}

// HandleConnection upgrades HTTP to WebSocket and registers the client.
func (h *Hub) HandleConnection(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("[ws] Upgrade error: %v", err)
		return
	}

	h.mu.Lock()
	h.clients[conn] = true
	h.mu.Unlock()

	log.Printf("[ws] Client connected (%d total)", len(h.clients))

	// Send welcome message
	h.sendTo(conn, Event{
		Type:      "connected",
		Payload:   map[string]interface{}{"message": "Connected to Tagent live feed"},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
	})

	// Keep connection alive, remove on disconnect
	go func() {
		defer func() {
			h.mu.Lock()
			delete(h.clients, conn)
			h.mu.Unlock()
			conn.Close()
			log.Printf("[ws] Client disconnected (%d remaining)", len(h.clients))
		}()
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				return
			}
		}
	}()
}

// Broadcast sends an event to all connected clients.
func (h *Hub) Broadcast(evt Event) {
	if evt.Timestamp == "" {
		evt.Timestamp = time.Now().UTC().Format(time.RFC3339)
	}

	h.mu.RLock()
	defer h.mu.RUnlock()

	data, _ := json.Marshal(evt)
	for conn := range h.clients {
		err := conn.WriteMessage(websocket.TextMessage, data)
		if err != nil {
			conn.Close()
			delete(h.clients, conn)
		}
	}
}

// ClientCount returns number of connected clients.
func (h *Hub) ClientCount() int {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return len(h.clients)
}

func (h *Hub) sendTo(conn *websocket.Conn, evt Event) {
	data, _ := json.Marshal(evt)
	conn.WriteMessage(websocket.TextMessage, data)
}
