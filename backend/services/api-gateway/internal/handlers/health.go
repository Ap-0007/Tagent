package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type HealthResponse struct {
	Status  string `json:"status"`
	Service string `json:"service"`
	Version string `json:"version"`
}

func HealthCheck(c *gin.Context) {
	c.JSON(http.StatusOK, HealthResponse{
		Status:  "healthy",
		Service: "tagent-api-gateway",
		Version: "0.1.0",
	})
}

func ReadinessCheck(c *gin.Context) {
	// TODO: Check downstream service connectivity
	c.JSON(http.StatusOK, HealthResponse{
		Status:  "ready",
		Service: "tagent-api-gateway",
		Version: "0.1.0",
	})
}
