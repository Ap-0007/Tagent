package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListIncidents(c *gin.Context) {
	// TODO: Fetch from monitoring/AI service
	c.JSON(http.StatusOK, gin.H{
		"incidents": []gin.H{},
		"total":     0,
	})
}

func GetIncident(c *gin.Context) {
	incidentID := c.Param("id")
	// TODO: Fetch from monitoring/AI service
	c.JSON(http.StatusOK, gin.H{
		"id":     incidentID,
		"status": "not_found",
	})
}
