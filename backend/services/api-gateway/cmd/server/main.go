package main

import (
	"log"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/tagent-ai/tagent/backend/services/api-gateway/internal/handlers"
	"github.com/tagent-ai/tagent/backend/services/api-gateway/internal/middleware"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := gin.Default()

	// Middleware
	router.Use(middleware.CORS())
	router.Use(middleware.RequestID())

	// Health check
	router.GET("/health", handlers.HealthCheck)
	router.GET("/ready", handlers.ReadinessCheck)

	// API v1
	v1 := router.Group("/api/v1")
	{
		// Cluster endpoints
		v1.GET("/clusters", handlers.ListClusters)
		v1.GET("/clusters/:id/resources", handlers.GetClusterResources)
		v1.GET("/clusters/:id/topology", handlers.GetClusterTopology)
		v1.POST("/clusters/scan", handlers.ScanCluster)

		// Incident endpoints
		v1.GET("/incidents", handlers.ListIncidents)
		v1.GET("/incidents/:id", handlers.GetIncident)

		// AI Assistant
		v1.POST("/ai/chat", handlers.AIChat)

		// Remediation
		v1.POST("/remediation/execute", handlers.ExecuteRemediation)
		v1.GET("/remediation/history", handlers.RemediationHistory)
	}

	// WebSocket for live updates
	router.GET("/ws", handlers.WebSocketHandler)

	log.Printf("Tagent API Gateway starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
