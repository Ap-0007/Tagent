package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type ChatRequest struct {
	Message string `json:"message" binding:"required"`
}

func AIChat(c *gin.Context) {
	var req ChatRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "message is required"})
		return
	}

	// TODO: Forward to AI Engine service
	c.JSON(http.StatusOK, gin.H{
		"response": "AI Engine not yet connected. Received: " + req.Message,
		"source":   "api-gateway-placeholder",
	})
}
