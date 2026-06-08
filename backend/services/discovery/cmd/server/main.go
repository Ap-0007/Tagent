package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
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

	// Autoscaling — fetch HPAs from K8s
	router.GET("/autoscaling", func(c *gin.Context) {
		hpas, err := client.AutoscalingV2().HorizontalPodAutoscalers("").List(context.Background(), metav1.ListOptions{})
		if err != nil {
			c.JSON(200, gin.H{"hpas": []gin.H{}, "vpas": []gin.H{}, "events": []gin.H{}})
			return
		}
		var hpaList []gin.H
		for _, h := range hpas.Items {
			current := int32(0)
			if h.Status.CurrentReplicas > 0 {
				current = h.Status.CurrentReplicas
			}
			desired := int32(0)
			if h.Status.DesiredReplicas > 0 {
				desired = h.Status.DesiredReplicas
			}
			minReplicas := int32(1)
			if h.Spec.MinReplicas != nil {
				minReplicas = *h.Spec.MinReplicas
			}
			status := "active"
			if current == desired {
				status = "stable"
			} else if current < desired {
				status = "scaling-up"
			} else {
				status = "scaling-down"
			}
			hpaList = append(hpaList, gin.H{
				"name":      h.Name,
				"namespace": h.Namespace,
				"current":   current,
				"desired":   desired,
				"min":       minReplicas,
				"max":       h.Spec.MaxReplicas,
				"status":    status,
				"age":       time.Since(h.CreationTimestamp.Time).Round(time.Hour).String(),
			})
		}
		if hpaList == nil {
			hpaList = []gin.H{}
		}
		c.JSON(200, gin.H{"hpas": hpaList, "vpas": []gin.H{}, "events": []gin.H{}})
	})

	// Logs — fetch pod logs from K8s API
	router.GET("/logs", func(c *gin.Context) {
		namespace := c.Query("namespace")
		pod := c.Query("pod")
		lines := int64(100)

		if pod != "" && namespace != "" {
			// Fetch specific pod logs
			opts := &corev1.PodLogOptions{TailLines: &lines}
			req := client.CoreV1().Pods(namespace).GetLogs(pod, opts)
			stream, err := req.Stream(context.Background())
			if err != nil {
				c.JSON(200, gin.H{"logs": []gin.H{}, "error": err.Error()})
				return
			}
			defer stream.Close()
			buf := make([]byte, 32*1024)
			n, _ := stream.Read(buf)
			logLines := strings.Split(string(buf[:n]), "\n")
			var entries []gin.H
			for i, line := range logLines {
				if line == "" {
					continue
				}
				entries = append(entries, gin.H{
					"id":        fmt.Sprintf("%s/%s-%d", namespace, pod, i),
					"timestamp": time.Now().UTC().Format(time.RFC3339),
					"pod":       pod,
					"namespace": namespace,
					"message":   line,
					"level":     guessLogLevel(line),
				})
			}
			if entries == nil {
				entries = []gin.H{}
			}
			c.JSON(200, gin.H{"logs": entries, "total": len(entries)})
			return
		}

		// If no specific pod, return recent events as "logs"
		events, err := client.CoreV1().Events("").List(context.Background(), metav1.ListOptions{Limit: lines})
		if err != nil {
			c.JSON(200, gin.H{"logs": []gin.H{}, "total": 0})
			return
		}
		var entries []gin.H
		for _, ev := range events.Items {
			level := "info"
			if ev.Type == "Warning" {
				level = "warning"
			}
			entries = append(entries, gin.H{
				"id":        string(ev.UID),
				"timestamp": ev.LastTimestamp.Time.Format(time.RFC3339),
				"pod":       ev.InvolvedObject.Name,
				"namespace": ev.InvolvedObject.Namespace,
				"message":   fmt.Sprintf("[%s] %s: %s", ev.InvolvedObject.Kind, ev.Reason, ev.Message),
				"level":     level,
			})
		}
		if entries == nil {
			entries = []gin.H{}
		}
		c.JSON(200, gin.H{"logs": entries, "total": len(entries)})
	})

	// Cost estimation — estimate based on resource requests
	router.GET("/cost/summary", func(c *gin.Context) {
		stateLock.RLock()
		defer stateLock.RUnlock()

		// Pricing: $0.048/vCPU-hour, $0.006/GB-hour (on-demand estimates)
		cpuRatePerHour := 0.048
		memRatePerGBHour := 0.006
		hoursPerMonth := 730.0

		totalCPUCores := 0.0
		totalMemGB := 0.0
		var items []gin.H

		if state != nil {
			for _, node := range state.Nodes {
				// Parse CPU capacity (e.g., "4" cores)
				cpuCores := 0.0
				if node.CPUCap != "" {
					var v float64
					fmt.Sscanf(node.CPUCap, "%f", &v)
					cpuCores = v
				}
				// Parse memory capacity (e.g., "16Gi")
				memGB := 0.0
				if node.MemCap != "" {
					memGB = parseMemToGB(node.MemCap)
				}
				totalCPUCores += cpuCores
				totalMemGB += memGB
				nodeCost := (cpuCores * cpuRatePerHour * hoursPerMonth) + (memGB * memRatePerGBHour * hoursPerMonth)
				items = append(items, gin.H{
					"name":      node.Name,
					"kind":      "Node",
					"namespace": "cluster",
					"estimate":  fmt.Sprintf("$%.2f/mo", nodeCost),
					"basis":     fmt.Sprintf("%.0f vCPU + %.1f GB RAM", cpuCores, memGB),
				})
			}
		}

		totalMonthly := (totalCPUCores * cpuRatePerHour * hoursPerMonth) + (totalMemGB * memRatePerGBHour * hoursPerMonth)

		// Simple savings recommendations
		var recommendations []gin.H
		if state != nil && state.Summary.FailedPods > 0 {
			recommendations = append(recommendations, gin.H{
				"title":  "Remove failing pods",
				"saving": fmt.Sprintf("$%.2f/mo", float64(state.Summary.FailedPods)*5.0),
				"detail": fmt.Sprintf("%d pods are failing and consuming resources without serving traffic.", state.Summary.FailedPods),
			})
		}
		if totalCPUCores > 8 {
			recommendations = append(recommendations, gin.H{
				"title":  "Consider spot/preemptible nodes",
				"saving": fmt.Sprintf("$%.2f/mo", totalMonthly*0.6),
				"detail": "Using spot instances for non-critical workloads can save up to 60%.",
			})
		}
		if items == nil {
			items = []gin.H{}
		}
		if recommendations == nil {
			recommendations = []gin.H{}
		}

		c.JSON(200, gin.H{
			"monthly_spend":     fmt.Sprintf("$%.2f", totalMonthly),
			"potential_savings": fmt.Sprintf("$%.2f", totalMonthly*0.25),
			"items":             items,
			"recommendations":  recommendations,
		})
	})

	log.Printf("Tagent Discovery Service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start: %v", err)
	}
}

// parseMemToGB converts K8s memory strings like "16Gi", "8192Mi", "16000000Ki" to GB
func parseMemToGB(mem string) float64 {
	mem = strings.TrimSpace(mem)
	if strings.HasSuffix(mem, "Gi") {
		var v float64
		fmt.Sscanf(mem, "%fGi", &v)
		return v
	}
	if strings.HasSuffix(mem, "Mi") {
		var v float64
		fmt.Sscanf(mem, "%fMi", &v)
		return v / 1024.0
	}
	if strings.HasSuffix(mem, "Ki") {
		var v float64
		fmt.Sscanf(mem, "%fKi", &v)
		return v / (1024.0 * 1024.0)
	}
	// Raw bytes
	var v float64
	fmt.Sscanf(mem, "%f", &v)
	return v / (1024.0 * 1024.0 * 1024.0)
}

// guessLogLevel tries to determine log level from log line content
func guessLogLevel(line string) string {
	lower := strings.ToLower(line)
	if strings.Contains(lower, "error") || strings.Contains(lower, "fatal") || strings.Contains(lower, "panic") {
		return "error"
	}
	if strings.Contains(lower, "warn") {
		return "warning"
	}
	if strings.Contains(lower, "debug") || strings.Contains(lower, "trace") {
		return "debug"
	}
	return "info"
}
