package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"time"

	"github.com/gin-gonic/gin"
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

func main() {
	port := envOr("PORT", "8085")

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		slackOk := slackWebhookURL != ""
		emailOk := smtpHost != "" && smtpUser != ""
		c.JSON(200, gin.H{
			"status":  "healthy",
			"service": "tagent-notification",
			"slack":   map[string]interface{}{"configured": slackOk},
			"email":   map[string]interface{}{"configured": emailOk, "host": smtpHost},
		})
	})

	router.POST("/notify", handleNotify)

	router.POST("/test/slack", func(c *gin.Context) {
		result := sendSlack("🧪 Tagent Test", "This is a test notification from Tagent.", "low", "")
		c.JSON(200, result)
	})

	router.POST("/test/email", func(c *gin.Context) {
		result := sendEmail("🧪 Tagent Test", "This is a test notification from Tagent.", "low", "")
		c.JSON(200, result)
	})

	log.Printf("Tagent Notification Service starting on port %s", port)
	log.Printf("  Slack: %v (webhook configured: %v)", slackWebhookURL != "", slackWebhookURL != "")
	log.Printf("  Email: %v (host: %s, from: %s, to: %s)", smtpHost != "", smtpHost, smtpFrom, smtpTo)

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
