package main

import (
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tagent-ai/tagent/backend/services/api-gateway/internal/ws"
)

var (
	discoveryURL   string
	monitoringURL  string
	aiEngineURL    string
	remediationURL string
	wsHub          *ws.Hub
)

func init() {
	discoveryURL = envOr("DISCOVERY_URL", "http://localhost:8081")
	monitoringURL = envOr("MONITORING_URL", "http://localhost:8082")
	aiEngineURL = envOr("AI_ENGINE_URL", "http://localhost:8083")
	remediationURL = envOr("REMEDIATION_URL", "http://localhost:8084")
}

func main() {
	port := envOr("PORT", "8080")

	router := gin.Default()

	// CORS
	router.Use(func(c *gin.Context) {
		c.Writer.Header().Set("Access-Control-Allow-Origin", "*")
		c.Writer.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Writer.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(204)
			return
		}
		c.Next()
	})

	// Health
	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "tagent-api-gateway", "version": "0.2.0", "ws_clients": wsHub.ClientCount()})
	})
	router.GET("/ready", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ready"})
	})

	// WebSocket endpoint for live updates
	wsHub = ws.NewHub()
	router.GET("/ws", func(c *gin.Context) {
		wsHub.HandleConnection(c.Writer, c.Request)
	})

	// Start background poller to broadcast new incidents
	poller := ws.NewPoller(wsHub, monitoringURL, 5*time.Second)
	go poller.Run()

	// ===== Discovery Service =====
	router.GET("/api/v1/clusters", proxyGet(discoveryURL, "/summary"))
	router.GET("/api/v1/resources", proxyGet(discoveryURL, "/resources"))
	router.GET("/api/v1/nodes", proxyGet(discoveryURL, "/nodes"))
	router.GET("/api/v1/pods", proxyGetWithQuery(discoveryURL, "/pods"))
	router.GET("/api/v1/deployments", proxyGet(discoveryURL, "/deployments"))
	router.GET("/api/v1/services", proxyGet(discoveryURL, "/services"))
	router.POST("/api/v1/scan", proxyPost(discoveryURL, "/scan"))

	// ===== AI Engine =====
	router.POST("/api/v1/ai/chat", proxyPost(aiEngineURL, "/api/v1/ai/chat"))
	router.POST("/api/v1/ai/analyze", proxyPost(aiEngineURL, "/api/v1/ai/analyze"))
	router.POST("/api/v1/ai/rca", proxyPost(aiEngineURL, "/api/v1/ai/rca"))

	// ===== Monitoring =====
	router.GET("/api/v1/metrics/summary", proxyGet(monitoringURL, "/summary"))
	router.GET("/api/v1/metrics/cpu", proxyGet(monitoringURL, "/metrics/cpu"))
	router.GET("/api/v1/metrics/memory", proxyGet(monitoringURL, "/metrics/memory"))

	// ===== Notification =====
	notificationURL := envOr("NOTIFICATION_URL", "http://localhost:8085")
	router.POST("/api/v1/notify", proxyPost(notificationURL, "/notify"))
	router.POST("/api/v1/notify/test/slack", proxyPost(notificationURL, "/test/slack"))
	router.POST("/api/v1/notify/test/email", proxyPost(notificationURL, "/test/email"))

	// ===== Remediation =====
	router.POST("/api/v1/remediation/execute", proxyPost(remediationURL, "/execute"))
	router.GET("/api/v1/remediation/history", proxyGet(remediationURL, "/history"))
	router.GET("/api/v1/remediation/audit", proxyGet(remediationURL, "/audit"))
	router.POST("/api/v1/guardian/enable", proxyPost(remediationURL, "/guardian/enable"))
	router.POST("/api/v1/guardian/disable", proxyPost(remediationURL, "/guardian/disable"))
	router.GET("/api/v1/guardian/status", proxyGet(remediationURL, "/guardian/status"))
	router.GET("/api/v1/night-guardian/status", proxyGet(remediationURL, "/night-guardian/status"))
	router.PUT("/api/v1/night-guardian/config", proxyPut(remediationURL, "/night-guardian/config"))
	router.POST("/api/v1/night-guardian/run", proxyPost(remediationURL, "/night-guardian/run"))
	router.GET("/api/v1/night-guardian/reports", proxyGet(remediationURL, "/night-guardian/reports"))

	// ===== Incidents (from Monitoring Service detector) =====
	router.GET("/api/v1/incidents/stored", proxyGet(remediationURL, "/incidents"))
	router.GET("/api/v1/incidents", proxyGet(monitoringURL, "/incidents"))
	router.GET("/api/v1/incidents/:id", func(c *gin.Context) {
		c.JSON(200, gin.H{"id": c.Param("id"), "status": "not_found"})
	})

	// ===== Reports (from PostgreSQL-backed remediation service) =====
	router.GET("/api/v1/reports", proxyGet(remediationURL, "/reports"))
	router.GET("/api/v1/reports/:id", func(c *gin.Context) {
		c.JSON(200, gin.H{"id": c.Param("id"), "content": ""})
	})

	// ===== Autoscaling (placeholder) =====
	router.GET("/api/v1/autoscaling", func(c *gin.Context) {
		c.JSON(200, gin.H{"hpas": []gin.H{}, "vpas": []gin.H{}, "events": []gin.H{}})
	})

	// ===== Cost (placeholder) =====
	router.GET("/api/v1/cost/summary", func(c *gin.Context) {
		c.JSON(200, gin.H{"monthly_spend": "$0", "potential_savings": "$0", "items": []gin.H{}, "recommendations": []gin.H{}})
	})

	// ===== Chaos (placeholder) =====
	router.GET("/api/v1/chaos/experiments", func(c *gin.Context) {
		c.JSON(200, gin.H{"experiments": []gin.H{}, "total": 0})
	})
	router.POST("/api/v1/chaos/experiments/:id/run", func(c *gin.Context) {
		c.JSON(200, gin.H{"id": c.Param("id"), "status": "not_implemented", "message": "Chaos testing not yet implemented", "timestamp": time.Now().UTC().Format(time.RFC3339)})
	})

	// ===== Audit (reads from remediation history) =====
	router.GET("/api/v1/audit", proxyGet(remediationURL, "/audit"))

	log.Printf("Tagent API Gateway starting on port %s", port)
	log.Printf("  Discovery:   %s", discoveryURL)
	log.Printf("  Monitoring:  %s", monitoringURL)
	log.Printf("  AI Engine:   %s", aiEngineURL)
	log.Printf("  Remediation: %s", remediationURL)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start: %v", err)
	}
}

func proxyGet(upstream, path string) gin.HandlerFunc {
	return func(c *gin.Context) {
		resp, err := http.Get(upstream + path)
		if err != nil {
			c.JSON(502, gin.H{"error": "upstream unreachable", "service": upstream})
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		c.Data(resp.StatusCode, "application/json", body)
	}
}

func proxyGetWithQuery(upstream, path string) gin.HandlerFunc {
	return func(c *gin.Context) {
		url := upstream + path
		if c.Request.URL.RawQuery != "" {
			url += "?" + c.Request.URL.RawQuery
		}
		resp, err := http.Get(url)
		if err != nil {
			c.JSON(502, gin.H{"error": "upstream unreachable", "service": upstream})
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		c.Data(resp.StatusCode, "application/json", body)
	}
}

func proxyPost(upstream, path string) gin.HandlerFunc {
	return func(c *gin.Context) {
		reqBody, _ := io.ReadAll(c.Request.Body)
		resp, err := http.Post(upstream+path, "application/json", strings.NewReader(string(reqBody)))
		if err != nil {
			c.JSON(502, gin.H{"error": "upstream unreachable", "service": upstream})
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		c.Data(resp.StatusCode, "application/json", body)
	}
}

func proxyPut(upstream, path string) gin.HandlerFunc {
	return func(c *gin.Context) {
		reqBody, _ := io.ReadAll(c.Request.Body)
		req, err := http.NewRequest(http.MethodPut, upstream+path, strings.NewReader(string(reqBody)))
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		req.Header.Set("Content-Type", "application/json")
		resp, err := http.DefaultClient.Do(req)
		if err != nil {
			c.JSON(502, gin.H{"error": "upstream unreachable", "service": upstream})
			return
		}
		defer resp.Body.Close()
		body, _ := io.ReadAll(resp.Body)
		c.Data(resp.StatusCode, "application/json", body)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
