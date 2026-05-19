package ws

import (
	"encoding/json"
	"io"
	"log"
	"net/http"
	"time"
)

// Poller polls backend services and broadcasts changes via WebSocket.
type Poller struct {
	hub           *Hub
	monitoringURL string
	interval      time.Duration
	lastCount     int
}

// NewPoller creates a poller that watches for new incidents.
func NewPoller(hub *Hub, monitoringURL string, interval time.Duration) *Poller {
	return &Poller{
		hub:           hub,
		monitoringURL: monitoringURL,
		interval:      interval,
	}
}

// Run starts the polling loop.
func (p *Poller) Run() {
	ticker := time.NewTicker(p.interval)
	defer ticker.Stop()

	log.Printf("[ws-poller] Started (monitoring: %s, interval: %s)", p.monitoringURL, p.interval)

	for range ticker.C {
		p.check()
	}
}

func (p *Poller) check() {
	resp, err := http.Get(p.monitoringURL + "/incidents")
	if err != nil {
		return
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)

	var result struct {
		Incidents []json.RawMessage `json:"incidents"`
		Total     int               `json:"total"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return
	}

	// Broadcast only when new incidents appear
	if result.Total > p.lastCount && p.lastCount > 0 {
		newCount := result.Total - p.lastCount
		log.Printf("[ws-poller] %d new incident(s) detected, broadcasting", newCount)

		// Send the newest incidents
		for i := p.lastCount; i < result.Total && i < len(result.Incidents); i++ {
			p.hub.Broadcast(Event{
				Type:    "incident",
				Payload: result.Incidents[i],
			})
		}
	}

	p.lastCount = result.Total
}
