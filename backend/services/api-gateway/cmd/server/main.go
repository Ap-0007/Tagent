package main

import (
	"io"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

var (
	discoveryURL   string
	monitoringURL  string
	aiEngineURL    string
	remediationURL string
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
		c.JSON(200, gin.H{"status": "healthy", "service": "tagent-api-gateway", "version": "0.1.0"})
	})
	router.GET("/ready", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ready"})
	})

	// Proxy to Discovery Service
	router.GET("/api/v1/clusters", proxy(discoveryURL, "/summary"))
	router.GET("/api/v1/resources", proxy(discoveryURL, "/resources"))
	router.GET("/api/v1/nodes", proxy(discoveryURL, "/nodes"))
	router.GET("/api/v1/pods", proxy(discoveryURL, "/pods"))
	router.GET("/api/v1/deployments", proxy(discoveryURL, "/deployments"))
	router.GET("/api/v1/services", proxy(discoveryURL, "/services"))
	router.POST("/api/v1/scan", proxy(discoveryURL, "/scan"))

	// Proxy to AI Engine
	router.POST("/api/v1/ai/chat", proxyPost(aiEngineURL, "/api/v1/ai/chat"))
	router.POST("/api/v1/ai/analyze", proxyPost(aiEngineURL, "/api/v1/ai/analyze"))
	router.POST("/api/v1/ai/rca", proxyPost(aiEngineURL, "/api/v1/ai/rca"))

	// Proxy to Remediation
	router.POST("/api/v1/remediation/execute", proxyPost(remediationURL, "/execute"))
	router.GET("/api/v1/remediation/history", proxy(remediationURL, "/history"))

	log.Printf("Tagent API Gateway starting on port %s", port)
	log.Printf("  Discovery: %s", discoveryURL)
	log.Printf("  AI Engine: %s", aiEngineURL)
	log.Printf("  Remediation: %s", remediationURL)

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start: %v", err)
	}
}

func proxy(upstream, path string) gin.HandlerFunc {
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

func proxyPost(upstream, path string) gin.HandlerFunc {
	return func(c *gin.Context) {
		resp, err := http.Post(upstream+path, "application/json", c.Request.Body)
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
