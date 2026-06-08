package secrets

import (
	"log"

	"github.com/gin-gonic/gin"
)

// IntegrationConfig defines what credentials each integration needs
var IntegrationConfigs = map[string]IntegrationDef{
	"slack": {
		ID: "slack", Name: "Slack", SetupType: "OAuth + Bot Token",
		Fields: []FieldDef{
			{Key: "SLACK_BOT_TOKEN", Label: "Bot User OAuth Token", Placeholder: "xoxb-...", Required: true, Secret: true},
			{Key: "SLACK_SIGNING_SECRET", Label: "Signing Secret", Placeholder: "abc123...", Required: false, Secret: true},
			{Key: "SLACK_WEBHOOK_URL", Label: "Webhook URL (alternative)", Placeholder: "https://hooks.slack.com/services/...", Required: false, Secret: true},
			{Key: "SLACK_CHANNEL_ID", Label: "Default Channel ID", Placeholder: "C01234567", Required: false, Secret: false},
		},
	},
	"teams": {
		ID: "teams", Name: "Microsoft Teams", SetupType: "Incoming Webhook",
		Fields: []FieldDef{
			{Key: "TEAMS_WEBHOOK_URL", Label: "Incoming Webhook URL", Placeholder: "https://outlook.office.com/webhook/...", Required: true, Secret: true},
		},
	},
	"email": {
		ID: "email", Name: "Email", SetupType: "SMTP",
		Fields: []FieldDef{
			{Key: "SMTP_HOST", Label: "SMTP Host", Placeholder: "smtp.gmail.com", Required: true, Secret: false},
			{Key: "SMTP_PORT", Label: "SMTP Port", Placeholder: "587", Required: true, Secret: false},
			{Key: "SMTP_USER", Label: "SMTP Username", Placeholder: "alerts@yourcompany.com", Required: true, Secret: false},
			{Key: "SMTP_PASSWORD", Label: "SMTP Password / App Password", Placeholder: "••••••••", Required: true, Secret: true},
			{Key: "SMTP_TO", Label: "Alert Recipients (comma-separated)", Placeholder: "team@yourcompany.com,oncall@yourcompany.com", Required: true, Secret: false},
		},
	},
	"pagerduty": {
		ID: "pagerduty", Name: "PagerDuty", SetupType: "API Key + Integration Key",
		Fields: []FieldDef{
			{Key: "PAGERDUTY_API_KEY", Label: "REST API Key", Placeholder: "u+...", Required: true, Secret: true},
			{Key: "PAGERDUTY_SERVICE_ID", Label: "Service ID", Placeholder: "P1234AB", Required: true, Secret: false},
			{Key: "PAGERDUTY_INTEGRATION_KEY", Label: "Events API v2 Integration Key", Placeholder: "abc123def456...", Required: true, Secret: true},
		},
	},
	"opsgenie": {
		ID: "opsgenie", Name: "Opsgenie", SetupType: "API Key",
		Fields: []FieldDef{
			{Key: "OPSGENIE_API_KEY", Label: "API Key", Placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Required: true, Secret: true},
			{Key: "OPSGENIE_TEAM_ID", Label: "Team ID", Placeholder: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx", Required: false, Secret: false},
		},
	},
	"twilio": {
		ID: "twilio", Name: "Twilio", SetupType: "Account SID + Auth Token",
		Fields: []FieldDef{
			{Key: "TWILIO_ACCOUNT_SID", Label: "Account SID", Placeholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", Required: true, Secret: false},
			{Key: "TWILIO_AUTH_TOKEN", Label: "Auth Token", Placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", Required: true, Secret: true},
			{Key: "TWILIO_FROM_NUMBER", Label: "From Phone Number", Placeholder: "+15551234567", Required: true, Secret: false},
			{Key: "ALERT_PHONE_NUMBERS", Label: "Alert Phone Numbers (comma-separated)", Placeholder: "+15559876543,+15551112222", Required: true, Secret: false},
		},
	},
	"webhooks": {
		ID: "webhooks", Name: "Webhooks", SetupType: "Custom Endpoint + HMAC Secret",
		Fields: []FieldDef{
			{Key: "WEBHOOK_ENDPOINTS", Label: "Webhook Endpoint URLs (comma-separated)", Placeholder: "https://your-app.com/webhooks/tagent", Required: true, Secret: false},
			{Key: "WEBHOOK_SECRET", Label: "HMAC Signing Secret", Placeholder: "your-secret-key", Required: true, Secret: true},
		},
	},
	"jira": {
		ID: "jira", Name: "Jira", SetupType: "API Token",
		Fields: []FieldDef{
			{Key: "JIRA_BASE_URL", Label: "Jira Base URL", Placeholder: "https://your-org.atlassian.net", Required: true, Secret: false},
			{Key: "JIRA_EMAIL", Label: "Jira Email", Placeholder: "you@yourcompany.com", Required: true, Secret: false},
			{Key: "JIRA_API_TOKEN", Label: "API Token", Placeholder: "ATATT3xFfGF0...", Required: true, Secret: true},
			{Key: "JIRA_PROJECT_KEY", Label: "Project Key", Placeholder: "OPS", Required: true, Secret: false},
		},
	},
	"github": {
		ID: "github", Name: "GitHub", SetupType: "Personal Access Token",
		Fields: []FieldDef{
			{Key: "GITHUB_TOKEN", Label: "Personal Access Token", Placeholder: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx", Required: true, Secret: true},
			{Key: "GITHUB_OWNER", Label: "Organization / Owner", Placeholder: "your-org", Required: true, Secret: false},
			{Key: "GITHUB_REPO", Label: "Repository", Placeholder: "infrastructure", Required: false, Secret: false},
		},
	},
	"gitlab": {
		ID: "gitlab", Name: "GitLab", SetupType: "Personal Access Token",
		Fields: []FieldDef{
			{Key: "GITLAB_TOKEN", Label: "Personal Access Token", Placeholder: "glpat-xxxxxxxxxxxxxxxxxxxx", Required: true, Secret: true},
			{Key: "GITLAB_BASE_URL", Label: "GitLab Base URL", Placeholder: "https://gitlab.com", Required: true, Secret: false},
			{Key: "GITLAB_PROJECT_ID", Label: "Project ID", Placeholder: "12345678", Required: false, Secret: false},
		},
	},
}

type IntegrationDef struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	SetupType string     `json:"setup_type"`
	Fields    []FieldDef `json:"fields"`
}

type FieldDef struct {
	Key         string `json:"key"`
	Label       string `json:"label"`
	Placeholder string `json:"placeholder"`
	Required    bool   `json:"required"`
	Secret      bool   `json:"secret"` // if true, value is masked in GET responses
}

// RegisterSecretRoutes adds credential management endpoints
func RegisterSecretRoutes(router *gin.Engine, store *SecretStore) {
	g := router.Group("/integrations/config")

	// GET /integrations/config/:id — get field definitions + masked saved values
	g.GET("/:id", func(c *gin.Context) {
		id := c.Param("id")
		def, ok := IntegrationConfigs[id]
		if !ok {
			c.JSON(404, gin.H{"error": "unknown integration"})
			return
		}

		// Try to get saved (masked) values
		saved := make(map[string]string)
		if store != nil {
			masked, err := store.GetMaskedCredentials(id)
			if err == nil {
				saved = masked
			}
		}

		configured := store != nil && store.HasCredentials(id)

		c.JSON(200, gin.H{
			"integration": def,
			"saved":       saved,
			"configured":  configured,
		})
	})

	// POST /integrations/config/:id — save credentials to K8s Secret
	g.POST("/:id", func(c *gin.Context) {
		id := c.Param("id")
		_, ok := IntegrationConfigs[id]
		if !ok {
			c.JSON(404, gin.H{"error": "unknown integration"})
			return
		}

		var body map[string]string
		if err := c.ShouldBindJSON(&body); err != nil {
			c.JSON(400, gin.H{"error": "invalid JSON body", "detail": err.Error()})
			return
		}

		if store == nil {
			c.JSON(503, gin.H{"error": "K8s Secret store not available", "message": "Cannot connect to Kubernetes cluster. Credentials cannot be saved."})
			return
		}

		if err := store.SaveCredentials(id, body); err != nil {
			log.Printf("ERROR saving credentials for %s: %v", id, err)
			c.JSON(500, gin.H{"error": "failed to save credentials", "detail": err.Error()})
			return
		}

		log.Printf("AUDIT: credentials saved for integration %s", id)
		c.JSON(200, gin.H{"status": "saved", "integration": id, "message": "Credentials saved to Kubernetes Secret"})
	})

	// DELETE /integrations/config/:id — remove credentials
	g.DELETE("/:id", func(c *gin.Context) {
		id := c.Param("id")
		if store == nil {
			c.JSON(503, gin.H{"error": "K8s Secret store not available"})
			return
		}
		if err := store.DeleteCredentials(id); err != nil {
			c.JSON(500, gin.H{"error": "failed to delete credentials", "detail": err.Error()})
			return
		}
		log.Printf("AUDIT: credentials deleted for integration %s", id)
		c.JSON(200, gin.H{"status": "deleted", "integration": id})
	})

	// GET /integrations/config — list all integration definitions
	g.GET("", func(c *gin.Context) {
		var defs []gin.H
		for _, def := range IntegrationConfigs {
			configured := store != nil && store.HasCredentials(def.ID)
			defs = append(defs, gin.H{
				"id":         def.ID,
				"name":       def.Name,
				"setup_type": def.SetupType,
				"fields":     len(def.Fields),
				"configured": configured,
			})
		}
		c.JSON(200, gin.H{"integrations": defs})
	})
}

// InitSecretStore attempts to create a K8s SecretStore, returns nil if unavailable
func InitSecretStore() *SecretStore {
	store, err := NewSecretStore()
	if err != nil {
		log.Printf("WARNING: K8s Secret store unavailable: %v", err)
		log.Printf("  Integrations will use environment variables as fallback")
		return nil
	}
	log.Printf("K8s Secret store initialized (namespace: %s)", store.namespace)
	return store
}
