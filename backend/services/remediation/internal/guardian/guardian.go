package guardian

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// Config holds Night Guardian settings.
type Config struct {
	Enabled         bool
	MinConfidence   int    // 0-100, only auto-fix above this
	MonitoringURL   string // URL to monitoring service
	NotificationURL string // URL to notification service
}

// ActionLog records what the guardian did.
type ActionLog struct {
	ID         string    `json:"id"`
	IncidentID string    `json:"incident_id"`
	Action     string    `json:"action"`
	Target     string    `json:"target"`
	Status     string    `json:"status"` // "success", "failed", "skipped"
	Message    string    `json:"message"`
	Timestamp  time.Time `json:"timestamp"`
}

// Guardian is the autonomous remediation loop.
type Guardian struct {
	client  kubernetes.Interface
	config  Config
	logs    []ActionLog
	mu      sync.RWMutex
	counter int
}

func New(client kubernetes.Interface, cfg Config) *Guardian {
	return &Guardian{
		client: client,
		config: cfg,
		logs:   []ActionLog{},
	}
}

// GetLogs returns all action logs.
func (g *Guardian) GetLogs() []ActionLog {
	g.mu.RLock()
	defer g.mu.RUnlock()
	result := make([]ActionLog, len(g.logs))
	copy(result, g.logs)
	return result
}

// RunLoop starts the Night Guardian background loop.
func (g *Guardian) RunLoop(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	log.Printf("[guardian] Night Guardian started (enabled: %v, confidence: %d%%, interval: %s)", g.config.Enabled, g.config.MinConfidence, interval)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if !g.config.Enabled {
				continue
			}
			g.checkAndFix(ctx)
		}
	}
}

func (g *Guardian) checkAndFix(ctx context.Context) {
	// Fetch incidents from monitoring service
	incidents := g.fetchIncidents()
	if len(incidents) == 0 {
		return
	}

	for _, inc := range incidents {
		if inc.Status != "active" {
			continue
		}

		// Determine action based on incident type
		action, target, ns := g.determineAction(inc)
		if action == "" {
			continue
		}

		// Execute the fix
		log.Printf("[guardian] Auto-fixing: %s on %s/%s (incident: %s)", action, ns, target, inc.ID)
		result := g.execute(ctx, action, ns, target)

		// Log the action
		g.addLog(ActionLog{
			IncidentID: inc.ID,
			Action:     action,
			Target:     fmt.Sprintf("%s/%s", ns, target),
			Status:     result.status,
			Message:    result.message,
		})

		// Send notification
		g.notify(inc, action, result)
	}
}

type incident struct {
	ID        string `json:"id"`
	Title     string `json:"title"`
	Severity  string `json:"severity"`
	Status    string `json:"status"`
	Service   string `json:"service"`
	Namespace string `json:"namespace"`
	Node      string `json:"node"`
	RootCause string `json:"root_cause"`
}

func (g *Guardian) fetchIncidents() []incident {
	resp, err := http.Get(g.config.MonitoringURL + "/incidents")
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	var result struct {
		Incidents []incident `json:"incidents"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	return result.Incidents
}

func (g *Guardian) determineAction(inc incident) (action, target, namespace string) {
	// CrashLoopBackOff → restart pod (delete it, controller recreates)
	if contains(inc.Title, "CrashLoopBackOff") {
		return "restart-pod", inc.Service, inc.Namespace
	}

	// OOMKilled → restart pod
	if contains(inc.Title, "OOMKilled") {
		return "restart-pod", inc.Service, inc.Namespace
	}

	// Node NotReady → skip (too dangerous for auto-fix)
	if contains(inc.Title, "NotReady") {
		return "", "", ""
	}

	return "", "", ""
}

type execResult struct {
	status  string
	message string
}

func (g *Guardian) execute(ctx context.Context, action, namespace, target string) execResult {
	switch action {
	case "restart-pod":
		return g.restartPod(ctx, namespace, target)
	default:
		return execResult{status: "skipped", message: "unknown action"}
	}
}

func (g *Guardian) restartPod(ctx context.Context, namespace, serviceName string) execResult {
	// Find pods matching the service name
	pods, err := g.client.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{
		LabelSelector: fmt.Sprintf("app=%s", serviceName),
	})
	if err != nil {
		// Try without label selector — match by name prefix
		pods, err = g.client.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{})
		if err != nil {
			return execResult{status: "failed", message: fmt.Sprintf("cannot list pods: %v", err)}
		}
	}

	deleted := 0
	for _, pod := range pods.Items {
		if contains(pod.Name, serviceName) {
			// Only delete pods that are actually failing
			for _, cs := range pod.Status.ContainerStatuses {
				if cs.State.Waiting != nil && (cs.State.Waiting.Reason == "CrashLoopBackOff" || cs.State.Waiting.Reason == "Error") {
					err := g.client.CoreV1().Pods(namespace).Delete(ctx, pod.Name, metav1.DeleteOptions{})
					if err != nil {
						log.Printf("[guardian] Failed to delete pod %s: %v", pod.Name, err)
					} else {
						deleted++
						log.Printf("[guardian] Deleted pod %s (will be recreated by controller)", pod.Name)
					}
				}
			}
		}
	}

	if deleted == 0 {
		return execResult{status: "skipped", message: "no failing pods found to restart"}
	}
	return execResult{status: "success", message: fmt.Sprintf("restarted %d pod(s)", deleted)}
}

func (g *Guardian) notify(inc incident, action string, result execResult) {
	if g.config.NotificationURL == "" {
		return
	}

	payload := map[string]string{
		"channel":  "all",
		"title":    fmt.Sprintf("[Night Guardian] %s", inc.Title),
		"message":  fmt.Sprintf("Action: %s\nResult: %s\nDetail: %s", action, result.status, result.message),
		"severity": inc.Severity,
	}
	body, _ := json.Marshal(payload)
	http.Post(g.config.NotificationURL+"/notify", "application/json", bytes.NewReader(body))
}

func (g *Guardian) addLog(l ActionLog) {
	g.mu.Lock()
	defer g.mu.Unlock()
	g.counter++
	l.ID = fmt.Sprintf("GA-%04d", g.counter)
	l.Timestamp = time.Now().UTC()
	g.logs = append(g.logs, l)
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > 0 && containsStr(s, substr))
}

func containsStr(s, sub string) bool {
	for i := 0; i <= len(s)-len(sub); i++ {
		if s[i:i+len(sub)] == sub {
			return true
		}
	}
	return false
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
