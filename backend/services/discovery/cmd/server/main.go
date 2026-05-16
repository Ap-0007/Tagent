package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tagent-ai/tagent/backend/services/discovery/internal/k8s"
	"github.com/tagent-ai/tagent/backend/services/discovery/internal/scanner"
)

var (
	state     *scanner.ClusterState
	stateLock sync.RWMutex
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}

	// Initialize Kubernetes client
	client, err := k8s.NewClient()
	if err != nil {
		log.Fatalf("Failed to create K8s client: %v", err)
	}

	metrics, _ := k8s.NewMetricsClient() // metrics client is optional

	sc := scanner.New(client, metrics)

	// Initial scan
	log.Println("Performing initial cluster scan...")
	s, err := sc.Scan(context.Background())
	if err != nil {
		log.Fatalf("Initial scan failed: %v", err)
	}
	stateLock.Lock()
	state = s
	stateLock.Unlock()
	log.Printf("Scan complete: %d nodes, %d pods, %d deployments, %d services",
		state.Summary.TotalNodes, state.Summary.TotalPods,
		state.Summary.TotalDeployments, state.Summary.TotalServices)

	// Background scan loop (every 15 seconds)
	go func() {
		ticker := time.NewTicker(15 * time.Second)
		for range ticker.C {
			s, err := sc.Scan(context.Background())
			if err != nil {
				log.Printf("Scan error: %v", err)
				continue
			}
			stateLock.Lock()
			state = s
			stateLock.Unlock()
		}
	}()

	// HTTP server
	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "healthy", "service": "tagent-discovery"})
	})

	router.GET("/resources", func(c *gin.Context) {
		stateLock.RLock()
		defer stateLock.RUnlock()
		c.JSON(http.StatusOK, state)
	})

	router.GET("/summary", func(c *gin.Context) {
		stateLock.RLock()
		defer stateLock.RUnlock()
		c.JSON(http.StatusOK, state.Summary)
	})

	router.GET("/nodes", func(c *gin.Context) {
		stateLock.RLock()
		defer stateLock.RUnlock()
		c.JSON(http.StatusOK, state.Nodes)
	})

	router.GET("/pods", func(c *gin.Context) {
		stateLock.RLock()
		defer stateLock.RUnlock()
		ns := c.Query("namespace")
		if ns == "" {
			c.JSON(http.StatusOK, state.Pods)
			return
		}
		var filtered []scanner.PodInfo
		for _, p := range state.Pods {
			if p.Namespace == ns {
				filtered = append(filtered, p)
			}
		}
		c.JSON(http.StatusOK, filtered)
	})

	router.GET("/deployments", func(c *gin.Context) {
		stateLock.RLock()
		defer stateLock.RUnlock()
		c.JSON(http.StatusOK, state.Deployments)
	})

	router.GET("/services", func(c *gin.Context) {
		stateLock.RLock()
		defer stateLock.RUnlock()
		c.JSON(http.StatusOK, state.Services)
	})

	router.POST("/scan", func(c *gin.Context) {
		s, err := sc.Scan(context.Background())
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		stateLock.Lock()
		state = s
		stateLock.Unlock()
		c.JSON(http.StatusOK, gin.H{"message": "scan complete", "summary": state.Summary})
	})

	log.Printf("Tagent Discovery Service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start: %v", err)
	}
}
