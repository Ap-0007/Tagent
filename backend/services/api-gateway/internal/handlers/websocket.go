package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func WebSocketHandler(c *gin.Context) {
	// TODO: Implement WebSocket upgrade for live updates
	// Will stream: incidents, metrics, remediation status
	c.JSON(http.StatusNotImplemented, gin.H{
		"message": "WebSocket endpoint - not yet implemented",
	})
}
