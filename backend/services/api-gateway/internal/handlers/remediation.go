package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type RemediationRequest struct {
	Action    string `json:"action" binding:"required"`
	Target    string `json:"target" binding:"required"`
	Namespace string `json:"namespace"`
	DryRun    bool   `json:"dry_run"`
}

func ExecuteRemediation(c *gin.Context) {
	var req RemediationRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// TODO: Forward to remediation service with safety checks
	c.JSON(http.StatusAccepted, gin.H{
		"message": "Remediation request received",
		"action":  req.Action,
		"target":  req.Target,
		"dry_run": req.DryRun,
		"status":  "pending_approval",
	})
}

func RemediationHistory(c *gin.Context) {
	// TODO: Fetch from remediation service
	c.JSON(http.StatusOK, gin.H{
		"history": []gin.H{},
		"total":   0,
	})
}
