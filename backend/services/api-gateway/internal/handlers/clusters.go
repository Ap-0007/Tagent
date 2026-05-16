package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func ListClusters(c *gin.Context) {
	// TODO: Fetch from discovery service
	c.JSON(http.StatusOK, gin.H{
		"clusters": []gin.H{},
		"total":    0,
	})
}

func GetClusterResources(c *gin.Context) {
	clusterID := c.Param("id")
	// TODO: Fetch from discovery service
	c.JSON(http.StatusOK, gin.H{
		"cluster_id": clusterID,
		"resources":  []gin.H{},
	})
}

func GetClusterTopology(c *gin.Context) {
	clusterID := c.Param("id")
	// TODO: Fetch from discovery service
	c.JSON(http.StatusOK, gin.H{
		"cluster_id": clusterID,
		"topology":   gin.H{},
	})
}

func ScanCluster(c *gin.Context) {
	// TODO: Trigger discovery service scan
	c.JSON(http.StatusAccepted, gin.H{
		"message": "Cluster scan initiated",
		"status":  "scanning",
	})
}
