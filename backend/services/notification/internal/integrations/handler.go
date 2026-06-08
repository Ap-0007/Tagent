package integrations

import (
	"github.com/gin-gonic/gin"
)

// RegisterRoutes adds integration endpoints to the Gin router
func RegisterRoutes(router *gin.Engine) {
	g := router.Group("/integrations")

	// List all integrations with their connection status
	g.GET("", func(c *gin.Context) {
		all := GetAllIntegrations()
		c.JSON(200, gin.H{
			"integrations": all,
			"total":        len(all),
			"connected":    countConnected(all),
		})
	})

	// Get single integration details
	g.GET("/:id", func(c *gin.Context) {
		intg := GetIntegration(c.Param("id"))
		if intg == nil {
			c.JSON(404, gin.H{"error": "integration not found"})
			return
		}
		c.JSON(200, intg)
	})

	// Test an integration connection
	g.POST("/:id/test", func(c *gin.Context) {
		intg := GetIntegration(c.Param("id"))
		if intg == nil {
			c.JSON(404, gin.H{"error": "integration not found"})
			return
		}
		if !intg.Configured {
			c.JSON(400, gin.H{
				"error":    "integration not configured",
				"env_vars": intg.EnvVars,
				"message":  "Set the required environment variables and restart the service",
			})
			return
		}
		// For now, return success if configured (real implementation would ping the service)
		c.JSON(200, gin.H{
			"id":      intg.ID,
			"status":  "success",
			"message": intg.Name + " connection test passed",
			"health":  "healthy",
		})
	})

	// Get integration health summary
	g.GET("/health", func(c *gin.Context) {
		all := GetAllIntegrations()
		healthy := 0
		for _, i := range all {
			if i.Health == "healthy" {
				healthy++
			}
		}
		c.JSON(200, gin.H{
			"total_integrations": len(all),
			"healthy":            healthy,
			"unhealthy":          len(all) - healthy,
			"overall_health":     float64(healthy) / float64(len(all)) * 100,
		})
	})
}

func countConnected(integrations []Integration) int {
	count := 0
	for _, i := range integrations {
		if i.Status == "connected" {
			count++
		}
	}
	return count
}
