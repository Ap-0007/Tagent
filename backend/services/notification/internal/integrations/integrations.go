package integrations

import (
	"os"
	"time"
)

// Integration represents a configured external integration
type Integration struct {
	ID         string    `json:"id"`
	Name       string    `json:"name"`
	Status     string    `json:"status"`      // "connected", "not_connected", "error"
	LastSync   string    `json:"last_sync"`   // human-readable
	LastSyncAt time.Time `json:"last_sync_at"`
	SetupType  string    `json:"setup_type"`
	Health     string    `json:"health"` // "healthy", "degraded", "unhealthy"
	EnvVars    []string  `json:"env_vars"`
	Configured bool      `json:"configured"`
}

// GetAllIntegrations returns the status of all configured integrations
func GetAllIntegrations() []Integration {
	return []Integration{
		checkSlack(),
		checkTeams(),
		checkEmail(),
		checkPagerDuty(),
		checkOpsgenie(),
		checkTwilio(),
		checkWebhooks(),
		checkJira(),
		checkGitHub(),
		checkGitLab(),
	}
}

// GetIntegration returns a single integration by ID
func GetIntegration(id string) *Integration {
	all := GetAllIntegrations()
	for _, i := range all {
		if i.ID == id {
			return &i
		}
	}
	return nil
}

func checkSlack() Integration {
	token := os.Getenv("SLACK_BOT_TOKEN")
	webhook := os.Getenv("SLACK_WEBHOOK_URL")
	configured := token != "" || webhook != ""
	return Integration{
		ID: "slack", Name: "Slack",
		Status:     boolStatus(configured),
		Health:     boolHealth(configured),
		SetupType:  "OAuth + Bot Token",
		Configured: configured,
		EnvVars:    []string{"SLACK_BOT_TOKEN", "SLACK_SIGNING_SECRET", "SLACK_WEBHOOK_URL"},
		LastSync:   lastSyncStr(configured),
		LastSyncAt: time.Now(),
	}
}

func checkTeams() Integration {
	configured := os.Getenv("TEAMS_WEBHOOK_URL") != ""
	return Integration{
		ID: "teams", Name: "Microsoft Teams",
		Status: boolStatus(configured), Health: boolHealth(configured),
		SetupType: "Incoming Webhook", Configured: configured,
		EnvVars: []string{"TEAMS_WEBHOOK_URL"}, LastSync: lastSyncStr(configured), LastSyncAt: time.Now(),
	}
}

func checkEmail() Integration {
	configured := os.Getenv("SMTP_HOST") != "" && os.Getenv("SMTP_USER") != ""
	return Integration{
		ID: "email", Name: "Email",
		Status: boolStatus(configured), Health: boolHealth(configured),
		SetupType: "SMTP", Configured: configured,
		EnvVars: []string{"SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASSWORD", "SMTP_TO"}, LastSync: lastSyncStr(configured), LastSyncAt: time.Now(),
	}
}

func checkPagerDuty() Integration {
	configured := os.Getenv("PAGERDUTY_API_KEY") != ""
	return Integration{
		ID: "pagerduty", Name: "PagerDuty",
		Status: boolStatus(configured), Health: boolHealth(configured),
		SetupType: "API Key + Integration Key", Configured: configured,
		EnvVars: []string{"PAGERDUTY_API_KEY", "PAGERDUTY_SERVICE_ID", "PAGERDUTY_INTEGRATION_KEY"}, LastSync: lastSyncStr(configured), LastSyncAt: time.Now(),
	}
}

func checkOpsgenie() Integration {
	configured := os.Getenv("OPSGENIE_API_KEY") != ""
	return Integration{
		ID: "opsgenie", Name: "Opsgenie",
		Status: boolStatus(configured), Health: boolHealth(configured),
		SetupType: "API Key", Configured: configured,
		EnvVars: []string{"OPSGENIE_API_KEY", "OPSGENIE_TEAM_ID"}, LastSync: lastSyncStr(configured), LastSyncAt: time.Now(),
	}
}

func checkTwilio() Integration {
	configured := os.Getenv("TWILIO_ACCOUNT_SID") != "" && os.Getenv("TWILIO_AUTH_TOKEN") != ""
	return Integration{
		ID: "twilio", Name: "Twilio",
		Status: boolStatus(configured), Health: boolHealth(configured),
		SetupType: "Account SID + Auth Token", Configured: configured,
		EnvVars: []string{"TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER", "ALERT_PHONE_NUMBERS"}, LastSync: lastSyncStr(configured), LastSyncAt: time.Now(),
	}
}

func checkWebhooks() Integration {
	configured := os.Getenv("WEBHOOK_ENDPOINTS") != ""
	return Integration{
		ID: "webhooks", Name: "Webhooks",
		Status: boolStatus(configured), Health: boolHealth(configured),
		SetupType: "Custom Endpoint + HMAC Secret", Configured: configured,
		EnvVars: []string{"WEBHOOK_ENDPOINTS", "WEBHOOK_SECRET"}, LastSync: lastSyncStr(configured), LastSyncAt: time.Now(),
	}
}

func checkJira() Integration {
	configured := os.Getenv("JIRA_API_TOKEN") != "" && os.Getenv("JIRA_BASE_URL") != ""
	return Integration{
		ID: "jira", Name: "Jira",
		Status: boolStatus(configured), Health: boolHealth(configured),
		SetupType: "API Token", Configured: configured,
		EnvVars: []string{"JIRA_BASE_URL", "JIRA_EMAIL", "JIRA_API_TOKEN", "JIRA_PROJECT_KEY"}, LastSync: lastSyncStr(configured), LastSyncAt: time.Now(),
	}
}

func checkGitHub() Integration {
	configured := os.Getenv("GITHUB_TOKEN") != ""
	return Integration{
		ID: "github", Name: "GitHub",
		Status: boolStatus(configured), Health: boolHealth(configured),
		SetupType: "Personal Access Token", Configured: configured,
		EnvVars: []string{"GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"}, LastSync: lastSyncStr(configured), LastSyncAt: time.Now(),
	}
}

func checkGitLab() Integration {
	configured := os.Getenv("GITLAB_TOKEN") != ""
	return Integration{
		ID: "gitlab", Name: "GitLab",
		Status: boolStatus(configured), Health: boolHealth(configured),
		SetupType: "Personal Access Token", Configured: configured,
		EnvVars: []string{"GITLAB_TOKEN", "GITLAB_BASE_URL", "GITLAB_PROJECT_ID"}, LastSync: lastSyncStr(configured), LastSyncAt: time.Now(),
	}
}

func boolStatus(configured bool) string {
	if configured {
		return "connected"
	}
	return "not_connected"
}

func boolHealth(configured bool) string {
	if configured {
		return "healthy"
	}
	return "unhealthy"
}

func lastSyncStr(configured bool) string {
	if configured {
		return "just now"
	}
	return "never"
}
