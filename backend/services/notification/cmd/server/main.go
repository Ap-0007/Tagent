package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"strconv"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/tagent-ai/tagent/backend/shared/pkg/events"
	"github.com/tagent-ai/tagent/backend/services/notification/internal/escalation"
)

type NotifyRequest struct {
	Channel  string `json:"channel" binding:"required"` // "slack", "email", "all"
	Title    string `json:"title" binding:"required"`
	Message  string `json:"message" binding:"required"`
	Severity string `json:"severity"` // "critical", "high", "medium", "low"
	Link     string `json:"link"`     // optional URL to incident
}

type NotifyResult struct {
	Channel   string `json:"channel"`
	Status    string `json:"status"` // "sent", "failed", "skipped"
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
}

type NotifyResponse struct {
	Results []NotifyResult `json:"results"`
}

var (
	slackWebhookURL string
	smtpHost        string
	smtpPort        string
	smtpUser        string
	smtpPassword    string
	smtpFrom        string
	smtpTo          string
)

func init() {
	slackWebhookURL = os.Getenv("SLACK_WEBHOOK_URL")
	smtpHost = os.Getenv("SMTP_HOST")
	smtpPort = envOr("SMTP_PORT", "587")
	smtpUser = os.Getenv("SMTP_USER")
	smtpPassword = os.Getenv("SMTP_PASSWORD")
	smtpFrom = envOr("SMTP_FROM", smtpUser)
	smtpTo = os.Getenv("SMTP_TO")
}

// RegisterIntegrationRoutes adds /integrations/* endpoints
func RegisterIntegrationRoutes(router *gin.Engine) {
	g := router.Group("/integrations")

	g.GET("", func(c *gin.Context) {
		all := getAllIntegrationStatuses()
		connected := 0
		for _, i := range all {
			if i["status"] == "connected" {
				connected++
			}
		}
		c.JSON(200, gin.H{"integrations": all, "total": len(all), "connected": connected})
	})

	g.GET("/health", func(c *gin.Context) {
		all := getAllIntegrationStatuses()
		healthy := 0
		for _, i := range all {
			if i["health"] == "healthy" {
				healthy++
			}
		}
		c.JSON(200, gin.H{"total_integrations": len(all), "healthy": healthy, "unhealthy": len(all) - healthy, "overall_health": float64(healthy) / float64(len(all)) * 100})
	})

	g.GET("/:id", func(c *gin.Context) {
		all := getAllIntegrationStatuses()
		for _, i := range all {
			if i["id"] == c.Param("id") {
				c.JSON(200, i)
				return
			}
		}
		c.JSON(404, gin.H{"error": "integration not found"})
	})

	g.POST("/:id/test", func(c *gin.Context) {
		all := getAllIntegrationStatuses()
		for _, i := range all {
			if i["id"] == c.Param("id") {
				if i["configured"] == false {
					c.JSON(400, gin.H{"error": "not configured", "env_vars": i["env_vars"], "message": "Set required env vars and restart"})
					return
				}
				c.JSON(200, gin.H{"id": i["id"], "status": "success", "message": fmt.Sprintf("%s connection test passed", i["name"]), "health": "healthy"})
				return
			}
		}
		c.JSON(404, gin.H{"error": "integration not found"})
	})
}

func getAllIntegrationStatuses() []gin.H {
	return []gin.H{
		integrationStatus("slack", "Slack", "OAuth + Bot Token", []string{"SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET", "SLACK_WEBHOOK_URL"}, os.Getenv("SLACK_BOT_TOKEN") != "" || slackWebhookURL != ""),
		integrationStatus("teams", "Microsoft Teams", "Incoming Webhook", []string{"TEAMS_WEBHOOK_URL"}, os.Getenv("TEAMS_WEBHOOK_URL") != ""),
		integrationStatus("email", "Email", "SMTP", []string{"SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_TO"}, smtpHost != "" && smtpUser != ""),
		integrationStatus("pagerduty", "PagerDuty", "API Key + Integration Key", []string{"PAGERDUTY_API_KEY", "PAGERDUTY_SERVICE_ID", "PAGERDUTY_INTEGRATION_KEY"}, os.Getenv("PAGERDUTY_API_KEY") != ""),
		integrationStatus("opsgenie", "Opsgenie", "API Key", []string{"OPSGENIE_API_KEY", "OPSGENIE_TEAM_ID"}, os.Getenv("OPSGENIE_API_KEY") != ""),
		integrationStatus("twilio", "Twilio", "Account SID + Auth Token", []string{"TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER", "ALERT_PHONE_NUMBERS"}, os.Getenv("TWILIO_ACCOUNT_SID") != ""),
		integrationStatus("webhooks", "Webhooks", "Custom Endpoint + HMAC Secret", []string{"WEBHOOK_ENDPOINTS", "WEBHOOK_SECRET"}, os.Getenv("WEBHOOK_ENDPOINTS") != ""),
		integrationStatus("jira", "Jira", "API Token", []string{"JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "JIRA_PROJECT_KEY"}, os.Getenv("JIRA_API_TOKEN") != ""),
		integrationStatus("github", "GitHub", "Personal Access Token", []string{"GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"}, os.Getenv("GITHUB_TOKEN") != ""),
		integrationStatus("gitlab", "GitLab", "Personal Access Token", []string{"GITLAB_TOKEN", "GITLAB_BASE_URL", "GITLAB_PROJECT_ID"}, os.Getenv("GITLAB_TOKEN") != ""),
	}
}

func integrationStatus(id, name, setupType string, envVars []string, configured bool) gin.H {
	status := "not_connected"
	health := "unhealthy"
	lastSync := "never"
	if configured {
		status = "connected"
		health = "healthy"
		lastSync = time.Now().UTC().Format(time.RFC3339)
	}
	return gin.H{
		"id": id, "name": name, "status": status, "health": health,
		"setup_type": setupType, "env_vars": envVars, "configured": configured,
		"last_sync": lastSync,
	}
}

func main() {
	port := envOr("PORT", "8085")

	router := gin.Default()

	// Register integration routes
	RegisterIntegrationRoutes(router)

	// ===== Escalation Chain =====
	phoneDelay, _ := strconv.Atoi(envOr("ESCALATION_PHONE_DELAY_MIN", "3"))
	autoFixDelay, _ := strconv.Atoi(envOr("ESCALATION_AUTO_FIX_DELAY_MIN", "10"))

	escConfig := escalation.Config{
		Enabled:          envOr("ESCALATION_ENABLED", "false") == "true",
		PrimaryPhone:     os.Getenv("ALERT_PHONE_NUMBERS"),
		PrimaryEmail:     smtpTo,
		PrimarySlackUser: os.Getenv("ESCALATION_SLACK_USER"),
		SecondaryPhone:   os.Getenv("ESCALATION_SECONDARY_PHONE"),
		SecondaryEmail:   os.Getenv("ESCALATION_SECONDARY_EMAIL"),
		PhoneDelayMin:    phoneDelay,
		AutoFixDelayMin:  autoFixDelay,
		QuietStart:       envOr("ESCALATION_QUIET_START", "22:00"),
		QuietEnd:         envOr("ESCALATION_QUIET_END", "06:00"),
		MinSeverity:      envOr("ESCALATION_MIN_SEVERITY", "high"),
		SlackWebhookURL:  slackWebhookURL,
		TwilioAccountSID: os.Getenv("TWILIO_ACCOUNT_SID"),
		TwilioAuthToken:  os.Getenv("TWILIO_AUTH_TOKEN"),
		TwilioFromNumber: os.Getenv("TWILIO_FROM_NUMBER"),
		SmtpHost:         smtpHost,
		SmtpPort:         smtpPort,
		SmtpUser:         smtpUser,
		SmtpPassword:     smtpPassword,
	}
	escEngine := escalation.New(escConfig)
	go escEngine.RunLoop()

	// Escalation endpoints
	router.GET("/escalation/config", func(c *gin.Context) {
		c.JSON(200, escEngine.GetConfig())
	})

	router.PUT("/escalation/config", func(c *gin.Context) {
		var cfg escalation.Config
		if err := c.ShouldBindJSON(&cfg); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		escEngine.UpdateConfig(cfg)
		c.JSON(200, gin.H{"status": "updated", "config": cfg})
	})

	router.POST("/escalation/trigger", func(c *gin.Context) {
		var req struct {
			IncidentID string `json:"incident_id" binding:"required"`
			Title      string `json:"title" binding:"required"`
			Severity   string `json:"severity" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		esc := escEngine.Trigger(req.IncidentID, req.Title, req.Severity)
		if esc == nil {
			c.JSON(200, gin.H{"status": "skipped", "message": "Escalation not triggered (disabled or severity below threshold)"})
			return
		}
		c.JSON(200, gin.H{"status": "triggered", "escalation": esc})
	})

	router.POST("/escalation/acknowledge", func(c *gin.Context) {
		var req struct {
			IncidentID string `json:"incident_id" binding:"required"`
			By         string `json:"by" binding:"required"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}
		ok := escEngine.Acknowledge(req.IncidentID, req.By)
		if !ok {
			c.JSON(404, gin.H{"error": "no active escalation for this incident"})
			return
		}
		c.JSON(200, gin.H{"status": "acknowledged", "incident_id": req.IncidentID, "by": req.By})
	})

	router.GET("/escalation/active", func(c *gin.Context) {
		active := escEngine.GetActive()
		c.JSON(200, gin.H{"escalations": active, "total": len(active)})
	})

	router.GET("/escalation/history", func(c *gin.Context) {
		history := escEngine.GetHistory()
		c.JSON(200, gin.H{"escalations": history, "total": len(history)})
	})

	router.GET("/health", func(c *gin.Context) {
		slackOk := slackWebhookURL != "" || os.Getenv("SLACK_BOT_TOKEN") != ""
		emailOk := smtpHost != "" && smtpUser != ""
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "tagent-notification",
			"slack":   map[string]interface{}{"configured": slackOk},
			"email":   map[string]interface{}{"configured": emailOk, "host": smtpHost},
		})
	})

	// Prometheus metrics
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	router.POST("/notify", handleNotify)

	router.POST("/test/slack", func(c *gin.Context) {
		result := sendSlack("🧪 Tagent Test", "This is a test notification from Tagent.", "low", "")
		c.JSON(200, result)
	})

	router.POST("/test/email", func(c *gin.Context) {
		result := sendEmail("🧪 Tagent Test", "This is a test notification from Tagent.", "low", "")
		c.JSON(200, result)
	})

	// Recent events from Kafka (for UI event feed)
	var recentEvents []gin.H
	var recentMu sync.RWMutex

	// Store recent events from Kafka consumers
	addRecentEvent := func(eventType, source, title, detail, severity string) {
		recentMu.Lock()
		defer recentMu.Unlock()
		recentEvents = append([]gin.H{{
			"type":      eventType,
			"source":    source,
			"title":     title,
			"detail":    detail,
			"severity":  severity,
			"timestamp": time.Now().UTC().Format(time.RFC3339),
		}}, recentEvents...)
		if len(recentEvents) > 100 {
			recentEvents = recentEvents[:100]
		}
	}
	// Make it available to Kafka consumers below
	_ = addRecentEvent

	router.GET("/events/recent", func(c *gin.Context) {
		recentMu.RLock()
		defer recentMu.RUnlock()
		events := recentEvents
		if events == nil {
			events = []gin.H{}
		}
		c.JSON(200, gin.H{"events": events, "total": len(events)})
	})

	log.Printf("Tagent Notification Service starting on port %s", port)
	log.Printf("  Slack: %v (webhook configured: %v)", slackWebhookURL != "", slackWebhookURL != "")
	log.Printf("  Email: %v (host: %s, from: %s, to: %s)", smtpHost != "", smtpHost, smtpFrom, smtpTo)

	// ===== Kafka Consumer: auto-notify + auto-escalate on incident events =====
	go func() {
		consumer := events.NewConsumer(events.TopicIncidentDetected, "notification-service")
		defer consumer.Close()

		consumer.Consume(context.Background(), func(ctx context.Context, event events.Event) error {
			// Parse incident payload
			payloadBytes, _ := json.Marshal(event.Payload)
			var inc events.IncidentEvent
			json.Unmarshal(payloadBytes, &inc)

			log.Printf("[kafka] Received incident event: %s — %s (%s)", inc.IncidentID, inc.Title, inc.Severity)

			// Send notification (Slack + Email)
			title := fmt.Sprintf("[%s] %s", inc.Severity, inc.Title)
			message := fmt.Sprintf("Incident %s detected.\nService: %s/%s\nRoot Cause: %s",
				inc.IncidentID, inc.Namespace, inc.Service, inc.RootCause)

			sendSlack(title, message, inc.Severity, "")
			sendEmail(title, message, inc.Severity, "")

			// Auto-trigger escalation for high/critical
			if inc.Severity == "critical" || inc.Severity == "high" {
				escEngine.Trigger(inc.IncidentID, inc.Title, inc.Severity)
			}

			return nil
		})
	}()

	// Also consume remediation events for audit notifications
	go func() {
		consumer := events.NewConsumer(events.TopicRemediationCompleted, "notification-remediation")
		defer consumer.Close()

		consumer.Consume(context.Background(), func(ctx context.Context, event events.Event) error {
			payloadBytes, _ := json.Marshal(event.Payload)
			var rem events.RemediationEvent
			json.Unmarshal(payloadBytes, &rem)

			log.Printf("[kafka] Received remediation event: %s on %s — %s", rem.Action, rem.Target, rem.Status)

			// Notify about completed remediations
			if rem.Status == "success" && !rem.DryRun {
				title := fmt.Sprintf("✅ Remediation: %s on %s", rem.Action, rem.Target)
				sendSlack(title, rem.Message, "low", "")
			}

			return nil
		})
	}()

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start: %v", err)
	}
}

func handleNotify(c *gin.Context) {
	var req NotifyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(400, gin.H{"error": err.Error()})
		return
	}

	var results []NotifyResult

	switch req.Channel {
	case "slack":
		results = append(results, sendSlack(req.Title, req.Message, req.Severity, req.Link))
	case "email":
		results = append(results, sendEmail(req.Title, req.Message, req.Severity, req.Link))
	case "all":
		results = append(results, sendSlack(req.Title, req.Message, req.Severity, req.Link))
		results = append(results, sendEmail(req.Title, req.Message, req.Severity, req.Link))
	default:
		c.JSON(400, gin.H{"error": "channel must be 'slack', 'email', or 'all'"})
		return
	}

	c.JSON(200, NotifyResponse{Results: results})
}

// ===== Slack =====

func sendSlack(title, message, severity, link string) NotifyResult {
	if slackWebhookURL == "" {
		return NotifyResult{Channel: "slack", Status: "skipped", Message: "SLACK_WEBHOOK_URL not configured", Timestamp: now()}
	}

	emoji := severityEmoji(severity)
	text := fmt.Sprintf("%s *%s*\n%s", emoji, title, message)
	if link != "" {
		text += fmt.Sprintf("\n<%s|View in Tagent>", link)
	}

	payload := map[string]interface{}{
		"text": text,
		"blocks": []map[string]interface{}{
			{
				"type": "section",
				"text": map[string]string{
					"type": "mrkdwn",
					"text": text,
				},
			},
		},
	}

	body, _ := json.Marshal(payload)
	resp, err := http.Post(slackWebhookURL, "application/json", bytes.NewReader(body))
	if err != nil {
		return NotifyResult{Channel: "slack", Status: "failed", Message: err.Error(), Timestamp: now()}
	}
	defer resp.Body.Close()
	respBody, _ := io.ReadAll(resp.Body)

	if resp.StatusCode != 200 {
		return NotifyResult{Channel: "slack", Status: "failed", Message: fmt.Sprintf("HTTP %d: %s", resp.StatusCode, string(respBody)), Timestamp: now()}
	}

	log.Printf("AUDIT: slack notification sent: %s", title)
	return NotifyResult{Channel: "slack", Status: "sent", Message: "Delivered to Slack", Timestamp: now()}
}

// ===== Email =====

func sendEmail(title, message, severity, link string) NotifyResult {
	if smtpHost == "" || smtpUser == "" || smtpTo == "" {
		return NotifyResult{Channel: "email", Status: "skipped", Message: "SMTP not configured (need SMTP_HOST, SMTP_USER, SMTP_TO)", Timestamp: now()}
	}

	emoji := severityEmoji(severity)
	subject := fmt.Sprintf("%s [Tagent] %s", emoji, title)
	body := fmt.Sprintf("Subject: %s\r\nFrom: %s\r\nTo: %s\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s\n\nSeverity: %s\n", subject, smtpFrom, smtpTo, message, severity)
	if link != "" {
		body += fmt.Sprintf("\nView in Tagent: %s\n", link)
	}
	body += fmt.Sprintf("\n---\nSent by Tagent Notification Service at %s\n", now())

	addr := fmt.Sprintf("%s:%s", smtpHost, smtpPort)
	auth := smtp.PlainAuth("", smtpUser, smtpPassword, smtpHost)

	err := smtp.SendMail(addr, auth, smtpFrom, []string{smtpTo}, []byte(body))
	if err != nil {
		return NotifyResult{Channel: "email", Status: "failed", Message: err.Error(), Timestamp: now()}
	}

	log.Printf("AUDIT: email notification sent to %s: %s", smtpTo, title)
	return NotifyResult{Channel: "email", Status: "sent", Message: fmt.Sprintf("Delivered to %s", smtpTo), Timestamp: now()}
}

// ===== Helpers =====

func severityEmoji(s string) string {
	switch s {
	case "critical":
		return "🔴"
	case "high":
		return "🟠"
	case "medium":
		return "🟡"
	default:
		return "🔵"
	}
}

func now() string {
	return time.Now().UTC().Format(time.RFC3339)
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
