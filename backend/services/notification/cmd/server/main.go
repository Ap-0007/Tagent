package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	port := envOr("PORT", "8085")

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "service": "tagent-notification"})
	})

	router.POST("/notify", func(c *gin.Context) {
		// TODO: Send to Slack/email/phone
		c.JSON(http.StatusAccepted, gin.H{"message": "notification queued"})
	})

	log.Printf("Tagent Notification Service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start: %v", err)
	}
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
