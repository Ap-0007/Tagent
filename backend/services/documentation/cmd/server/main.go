package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func main() {
	port := envOr("PORT", "8086")

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "service": "tagent-documentation"})
	})

	router.GET("/reports", func(c *gin.Context) {
		// TODO: Fetch reports from database
		c.JSON(http.StatusOK, gin.H{"reports": []gin.H{}, "total": 0})
	})

	router.POST("/generate", func(c *gin.Context) {
		// TODO: Generate incident report
		c.JSON(http.StatusAccepted, gin.H{"message": "report generation queued"})
	})

	log.Printf("Tagent Documentation Service starting on port %s", port)
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
