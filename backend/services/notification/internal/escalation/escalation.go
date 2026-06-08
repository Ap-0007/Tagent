package escalation

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"os"
	"strings"
	"sync"
	"time"
)

// Config holds the escalation chain configuration
type Config struct {
	Enabled           bool   `json:"enabled"`
	PrimaryPhone      string `json:"primary_phone"`
	PrimaryEmail      string `json:"primary_email"`
	PrimarySlackUser  string `json:"primary_slack_user"`
	SecondaryPhone    string `json:"secondary_phone"`
	SecondaryEmail    string `json:"secondary_email"`
	PhoneDelayMin     int    `json:"phone_delay_min"`     // minutes before phone call (default 3)
	AutoFixDelayMin   int    `json:"auto_fix_delay_min"`  // minutes before auto-fix (default 10)
	QuietStart        string `json:"quiet_start"`         // e.g. "22:00"
	QuietEnd          string `json:"quiet_end"`           // e.g. "06:00"
	MinSeverity       string `json:"min_severity"`        // minimum severity to trigger (default "high")
	SlackWebhookURL   string `json:"slack_webhook_url"`
	TwilioAccountSID  string `json:"twilio_account_sid"`
	TwilioAuthToken   string `json:"twilio_auth_token"`
	TwilioFromNumber  string `json:"twilio_from_number"`
	SmtpHost          string `json:"smtp_host"`
	SmtpPort          string `json:"smtp_port"`
	SmtpUser          string `json:"smtp_user"`
	SmtpPassword      string `json:"smtp_password"`
}

// EscalationStep represents one step in the escalation chain
type EscalationStep struct {
	Level     int       `json:"level"`     // 1=slack, 2=email, 3=phone-primary, 4=phone-secondary, 5=auto-fix
	Channel   string    `json:"channel"`   // "slack", "email", "phone", "auto-fix"
	Status    string    `json:"status"`    // "pending", "sent", "delivered", "acknowledged", "failed"
	Target    string    `json:"target"`    // phone number, email, slack user
	SentAt    time.Time `json:"sent_at"`
	Message   string    `json:"message"`
	ErrorMsg  string    `json:"error_msg,omitempty"`
}

// ActiveEscalation tracks an ongoing escalation for one incident
type ActiveEscalation struct {
	ID             string           `json:"id"`
	IncidentID     string           `json:"incident_id"`
	IncidentTitle  string           `json:"incident_title"`
	Severity       string           `json:"severity"`
	Status         string           `json:"status"` // "active", "acknowledged", "resolved", "auto-fixed"
	StartedAt      time.Time        `json:"started_at"`
	AcknowledgedAt *time.Time       `json:"acknowledged_at,omitempty"`
	AcknowledgedBy string           `json:"acknowledged_by,omitempty"`
	Steps          []EscalationStep `json:"steps"`
	CurrentLevel   int              `json:"current_level"`
}

// Engine manages the escalation chain
type Engine struct {
	config      Config
	active      map[string]*ActiveEscalation // incident_id -> escalation
	history     []ActiveEscalation
	mu          sync.RWMutex
	stopCh      chan struct{}
	counter     int
}

// New creates a new escalation engine
func New(cfg Config) *Engine {
	return &Engine{
		config: cfg,
		active: make(map[string]*ActiveEscalation),
		stopCh: make(chan struct{}),
	}
}

// GetConfig returns current config
func (e *Engine) GetConfig() Config {
	e.mu.RLock()
	defer e.mu.RUnlock()
	return e.config
}

// UpdateConfig updates the escalation config
func (e *Engine) UpdateConfig(cfg Config) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.config = cfg
	log.Printf("[escalation] Config updated: enabled=%v, phone_delay=%dm, auto_fix=%dm", cfg.Enabled, cfg.PhoneDelayMin, cfg.AutoFixDelayMin)
}

// Trigger starts an escalation chain for an incident
func (e *Engine) Trigger(incidentID, title, severity string) *ActiveEscalation {
	e.mu.Lock()
	defer e.mu.Unlock()

	if !e.config.Enabled {
		return nil
	}

	// Check minimum severity
	if !e.meetsMinSeverity(severity) {
		return nil
	}

	// Check if already escalating for this incident
	if existing, ok := e.active[incidentID]; ok {
		return existing
	}

	// Check quiet hours (only escalate during quiet hours — that's when it matters most)
	// Actually, escalation is most important during quiet hours, so we always escalate

	e.counter++
	esc := &ActiveEscalation{
		ID:            fmt.Sprintf("ESC-%04d", e.counter),
		IncidentID:    incidentID,
		IncidentTitle: title,
		Severity:      severity,
		Status:        "active",
		StartedAt:     time.Now().UTC(),
		Steps:         []EscalationStep{},
		CurrentLevel:  0,
	}

	e.active[incidentID] = esc

	log.Printf("[escalation] Triggered for incident %s: %s (%s)", incidentID, title, severity)

	// Immediately send Slack (Level 1)
	go e.executeLevel1(esc)

	return esc
}

// Acknowledge stops the escalation
func (e *Engine) Acknowledge(incidentID, by string) bool {
	e.mu.Lock()
	defer e.mu.Unlock()

	esc, ok := e.active[incidentID]
	if !ok {
		return false
	}

	now := time.Now().UTC()
	esc.Status = "acknowledged"
	esc.AcknowledgedAt = &now
	esc.AcknowledgedBy = by

	// Move to history
	e.history = append([]ActiveEscalation{*esc}, e.history...)
	if len(e.history) > 100 {
		e.history = e.history[:100]
	}
	delete(e.active, incidentID)

	log.Printf("[escalation] Acknowledged by %s for incident %s", by, incidentID)
	return true
}

// GetActive returns all active escalations
func (e *Engine) GetActive() []ActiveEscalation {
	e.mu.RLock()
	defer e.mu.RUnlock()
	result := make([]ActiveEscalation, 0, len(e.active))
	for _, esc := range e.active {
		result = append(result, *esc)
	}
	return result
}

// GetHistory returns escalation history
func (e *Engine) GetHistory() []ActiveEscalation {
	e.mu.RLock()
	defer e.mu.RUnlock()
	result := make([]ActiveEscalation, len(e.history))
	copy(result, e.history)
	return result
}

// RunLoop runs the escalation timer loop (checks every 30 seconds for next steps)
func (e *Engine) RunLoop() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-e.stopCh:
			return
		case <-ticker.C:
			e.checkEscalations()
		}
	}
}

// Stop stops the escalation engine
func (e *Engine) Stop() {
	close(e.stopCh)
}

func (e *Engine) checkEscalations() {
	e.mu.Lock()
	defer e.mu.Unlock()

	for _, esc := range e.active {
		if esc.Status != "active" {
			continue
		}

		elapsed := time.Since(esc.StartedAt)

		// Level 2: Email (sent immediately with Slack)
		if esc.CurrentLevel < 2 && elapsed >= 0 {
			go e.executeLevel2(esc)
			esc.CurrentLevel = 2
		}

		// Level 3: Phone call to primary (after phone_delay_min)
		if esc.CurrentLevel < 3 && elapsed >= time.Duration(e.config.PhoneDelayMin)*time.Minute {
			go e.executeLevel3(esc)
			esc.CurrentLevel = 3
		}

		// Level 4: Phone call to secondary (after phone_delay_min + 2 min)
		if esc.CurrentLevel < 4 && elapsed >= time.Duration(e.config.PhoneDelayMin+2)*time.Minute {
			go e.executeLevel4(esc)
			esc.CurrentLevel = 4
		}

		// Level 5: Auto-fix or escalate to team lead (after auto_fix_delay_min)
		if esc.CurrentLevel < 5 && elapsed >= time.Duration(e.config.AutoFixDelayMin)*time.Minute {
			go e.executeLevel5(esc)
			esc.CurrentLevel = 5
		}
	}
}

// ===== Level Executors =====

func (e *Engine) executeLevel1(esc *ActiveEscalation) {
	step := EscalationStep{
		Level:   1,
		Channel: "slack",
		Target:  e.config.PrimarySlackUser,
		SentAt:  time.Now().UTC(),
		Message: fmt.Sprintf("🚨 INCIDENT: %s\nSeverity: %s\nID: %s\n\nAcknowledge within %d minutes or escalation continues to phone call.",
			esc.IncidentTitle, esc.Severity, esc.IncidentID, e.config.PhoneDelayMin),
	}

	// Send Slack
	err := e.sendSlackEscalation(step.Message, esc.Severity)
	if err != nil {
		step.Status = "failed"
		step.ErrorMsg = err.Error()
	} else {
		step.Status = "sent"
	}

	e.mu.Lock()
	esc.Steps = append(esc.Steps, step)
	e.mu.Unlock()
}

func (e *Engine) executeLevel2(esc *ActiveEscalation) {
	step := EscalationStep{
		Level:   2,
		Channel: "email",
		Target:  e.config.PrimaryEmail,
		SentAt:  time.Now().UTC(),
		Message: fmt.Sprintf("INCIDENT ALERT: %s\n\nSeverity: %s\nIncident ID: %s\n\nEscalation in progress. Acknowledge to stop further escalation.",
			esc.IncidentTitle, esc.Severity, esc.IncidentID),
	}

	err := e.sendEmailEscalation(step.Target, esc.IncidentTitle, step.Message, esc.Severity)
	if err != nil {
		step.Status = "failed"
		step.ErrorMsg = err.Error()
	} else {
		step.Status = "sent"
	}

	e.mu.Lock()
	esc.Steps = append(esc.Steps, step)
	e.mu.Unlock()
}

func (e *Engine) executeLevel3(esc *ActiveEscalation) {
	step := EscalationStep{
		Level:   3,
		Channel: "phone",
		Target:  e.config.PrimaryPhone,
		SentAt:  time.Now().UTC(),
		Message: fmt.Sprintf("Tagent detected a %s incident: %s. No acknowledgment received. Calling primary on-call.",
			esc.Severity, esc.IncidentTitle),
	}

	err := e.makePhoneCall(e.config.PrimaryPhone, esc.IncidentTitle, esc.Severity)
	if err != nil {
		step.Status = "failed"
		step.ErrorMsg = err.Error()
	} else {
		step.Status = "sent"
	}

	e.mu.Lock()
	esc.Steps = append(esc.Steps, step)
	e.mu.Unlock()
}

func (e *Engine) executeLevel4(esc *ActiveEscalation) {
	if e.config.SecondaryPhone == "" {
		return
	}

	step := EscalationStep{
		Level:   4,
		Channel: "phone",
		Target:  e.config.SecondaryPhone,
		SentAt:  time.Now().UTC(),
		Message: fmt.Sprintf("ESCALATION: Primary on-call did not respond. Calling secondary for incident: %s", esc.IncidentTitle),
	}

	err := e.makePhoneCall(e.config.SecondaryPhone, esc.IncidentTitle, esc.Severity)
	if err != nil {
		step.Status = "failed"
		step.ErrorMsg = err.Error()
	} else {
		step.Status = "sent"
	}

	e.mu.Lock()
	esc.Steps = append(esc.Steps, step)
	e.mu.Unlock()
}

func (e *Engine) executeLevel5(esc *ActiveEscalation) {
	step := EscalationStep{
		Level:   5,
		Channel: "auto-fix",
		Target:  "system",
		SentAt:  time.Now().UTC(),
		Message: fmt.Sprintf("No human response after %d minutes. Auto-fix trigger point reached for: %s",
			e.config.AutoFixDelayMin, esc.IncidentTitle),
	}
	step.Status = "sent"

	e.mu.Lock()
	esc.Steps = append(esc.Steps, step)
	esc.Status = "auto-fixed"

	// Move to history
	e.history = append([]ActiveEscalation{*esc}, e.history...)
	if len(e.history) > 100 {
		e.history = e.history[:100]
	}
	delete(e.active, esc.IncidentID)
	e.mu.Unlock()

	// Send final notification
	go e.sendSlackEscalation(
		fmt.Sprintf("⚡ AUTO-FIX TRIGGERED: %s\nNo human acknowledged within %d minutes. Night Guardian auto-fix activated.",
			esc.IncidentTitle, e.config.AutoFixDelayMin),
		"critical",
	)

	log.Printf("[escalation] Auto-fix triggered for incident %s after %d minutes", esc.IncidentID, e.config.AutoFixDelayMin)
}

// ===== Channel Implementations =====

func (e *Engine) sendSlackEscalation(message, severity string) error {
	webhookURL := e.config.SlackWebhookURL
	if webhookURL == "" {
		webhookURL = os.Getenv("SLACK_WEBHOOK_URL")
	}
	if webhookURL == "" {
		return fmt.Errorf("slack webhook not configured")
	}

	emoji := "🔴"
	if severity == "high" {
		emoji = "🟠"
	}

	payload := map[string]interface{}{
		"text": fmt.Sprintf("%s %s", emoji, message),
	}
	body, _ := json.Marshal(payload)
	resp, err := http.Post(webhookURL, "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return fmt.Errorf("slack returned HTTP %d", resp.StatusCode)
	}
	return nil
}

func (e *Engine) sendEmailEscalation(to, subject, message, severity string) error {
	host := e.config.SmtpHost
	if host == "" {
		host = os.Getenv("SMTP_HOST")
	}
	user := e.config.SmtpUser
	if user == "" {
		user = os.Getenv("SMTP_USER")
	}
	password := e.config.SmtpPassword
	if password == "" {
		password = os.Getenv("SMTP_PASSWORD")
	}
	port := e.config.SmtpPort
	if port == "" {
		port = envOr("SMTP_PORT", "587")
	}

	if host == "" || user == "" || to == "" {
		return fmt.Errorf("SMTP not configured")
	}

	emailBody := fmt.Sprintf("Subject: 🚨 [Tagent ESCALATION] %s\r\nFrom: %s\r\nTo: %s\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n%s\n\n---\nTagent Escalation Chain\n%s",
		subject, user, to, message, time.Now().UTC().Format(time.RFC3339))

	addr := fmt.Sprintf("%s:%s", host, port)
	auth := smtp.PlainAuth("", user, password, host)
	err := smtp.SendMail(addr, auth, user, []string{to}, []byte(emailBody))
	return err
}

func (e *Engine) makePhoneCall(phoneNumber, incidentTitle, severity string) error {
	accountSID := e.config.TwilioAccountSID
	if accountSID == "" {
		accountSID = os.Getenv("TWILIO_ACCOUNT_SID")
	}
	authToken := e.config.TwilioAuthToken
	if authToken == "" {
		authToken = os.Getenv("TWILIO_AUTH_TOKEN")
	}
	fromNumber := e.config.TwilioFromNumber
	if fromNumber == "" {
		fromNumber = os.Getenv("TWILIO_FROM_NUMBER")
	}

	if accountSID == "" || authToken == "" || fromNumber == "" {
		return fmt.Errorf("twilio not configured (need TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER)")
	}

	// Twilio REST API call
	url := fmt.Sprintf("https://api.twilio.com/2010-04-01/Accounts/%s/Calls.json", accountSID)

	twiml := fmt.Sprintf(`<Response><Say voice="alice">Tagent detected a %s severity incident. %s. Press 1 to acknowledge. Press 2 to trigger auto fix.</Say><Gather numDigits="1" action="/twilio/response"><Say>Press 1 to acknowledge or 2 to auto fix.</Say></Gather></Response>`,
		severity, incidentTitle)

	data := fmt.Sprintf("To=%s&From=%s&Twiml=%s", phoneNumber, fromNumber, twiml)
	req, err := http.NewRequest("POST", url, strings.NewReader(data))
	if err != nil {
		return err
	}
	req.SetBasicAuth(accountSID, authToken)
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return fmt.Errorf("twilio returned HTTP %d", resp.StatusCode)
	}

	log.Printf("[escalation] Phone call initiated to %s for incident: %s", phoneNumber, incidentTitle)
	return nil
}

func (e *Engine) meetsMinSeverity(severity string) bool {
	levels := map[string]int{"low": 1, "medium": 2, "high": 3, "critical": 4}
	minLevel := levels[e.config.MinSeverity]
	incLevel := levels[severity]
	if minLevel == 0 {
		minLevel = 3 // default: high
	}
	return incLevel >= minLevel
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
