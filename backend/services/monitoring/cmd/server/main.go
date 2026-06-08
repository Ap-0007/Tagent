package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/tagent-ai/tagent/backend/shared/pkg/events"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"

	"github.com/tagent-ai/tagent/backend/services/monitoring/internal/detector"
)

var (
	prometheusURL string
	det           *detector.Detector
)

func init() {
	prometheusURL = envOr("PROMETHEUS_URL", "http://localhost:9090")
}

func main() {
	port := envOr("PORT", "8082")

	// Init K8s client
	client, err := newK8sClient()
	if err != nil {
		log.Fatalf("Cannot create K8s client: %v", err)
	}

	// Start incident detector
	det = detector.New(client)
	go det.RunLoop(context.Background(), 10*time.Second)

	// Kafka event publisher — publishes new incidents to event bus
	publisher := events.NewPublisher("monitoring")
	defer publisher.Close()

	// Background loop: publish new incidents to Kafka
	go func() {
		var lastCount int
		ticker := time.NewTicker(10 * time.Second)
		defer ticker.Stop()
		for range ticker.C {
			incidents := det.GetIncidents()
			if len(incidents) > lastCount {
				// Publish new incidents
				for _, inc := range incidents[lastCount:] {
					_ = publisher.PublishIncident(context.Background(), events.TopicIncidentDetected, events.IncidentEvent{
						IncidentID: inc.ID,
						Title:      inc.Title,
						Severity:   inc.Severity,
						Status:     inc.Status,
						Service:    inc.Service,
						Namespace:  inc.Namespace,
						RootCause:  inc.RootCause,
					})
				}
				lastCount = len(incidents)
			}
		}
	}()

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{
			"status":     "healthy",
			"service":    "tagent-monitoring",
			"prometheus": prometheusURL,
			"incidents":  len(det.GetIncidents()),
		})
	})

	// Prometheus metrics endpoint
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Metrics summary (from Prometheus)
	router.GET("/summary", func(c *gin.Context) {
		summary := gin.H{
			"cluster_cpu_percent":    queryPromSingle(`100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`),
			"cluster_memory_percent": queryPromSingle(`(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`),
			"pod_metrics":            nil,
			"node_metrics":           nil,
			"alerts":                 queryAlerts(),
		}
		c.JSON(200, summary)
	})

	router.GET("/metrics/cpu", func(c *gin.Context) {
		c.Data(200, "application/json", queryPromRaw(`rate(container_cpu_usage_seconds_total{container!=""}[5m])`))
	})

	router.GET("/metrics/memory", func(c *gin.Context) {
		c.Data(200, "application/json", queryPromRaw(`container_memory_working_set_bytes{container!=""}`))
	})

	// Incidents detected by the rules engine
	router.GET("/incidents", func(c *gin.Context) {
		incidents := det.GetIncidents()
		c.JSON(200, gin.H{"incidents": incidents, "total": len(incidents)})
	})

	log.Printf("Tagent Monitoring Service starting on port %s", port)
	log.Printf("  Prometheus: %s", prometheusURL)
	log.Printf("  Incident detection: enabled (10s interval)")

	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start: %v", err)
	}
}

// ===== K8s Client =====

func newK8sClient() (*kubernetes.Clientset, error) {
	config, err := rest.InClusterConfig()
	if err != nil {
		kubeconfig := os.Getenv("KUBECONFIG")
		if kubeconfig == "" {
			home, _ := os.UserHomeDir()
			kubeconfig = filepath.Join(home, ".kube", "config")
		}
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return nil, err
		}
	}
	return kubernetes.NewForConfig(config)
}

// ===== Prometheus Queries =====

func queryPromSingle(query string) float64 {
	u := fmt.Sprintf("%s/api/v1/query?query=%s", prometheusURL, url.QueryEscape(query))
	resp, err := http.Get(u)
	if err != nil {
		return 0
	}
	defer resp.Body.Close()

	var result struct {
		Data struct {
			Result []struct {
				Value []interface{} `json:"value"`
			} `json:"result"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0
	}
	if len(result.Data.Result) > 0 && len(result.Data.Result[0].Value) >= 2 {
		if v, ok := result.Data.Result[0].Value[1].(string); ok {
			var f float64
			fmt.Sscanf(v, "%f", &f)
			return f
		}
	}
	return 0
}

func queryPromRaw(query string) []byte {
	u := fmt.Sprintf("%s/api/v1/query?query=%s", prometheusURL, url.QueryEscape(query))
	resp, err := http.Get(u)
	if err != nil {
		return []byte(`{"error":"prometheus unreachable"}`)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return body
}

func queryAlerts() []gin.H {
	u := fmt.Sprintf("%s/api/v1/alerts", prometheusURL)
	resp, err := http.Get(u)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	var result struct {
		Data struct {
			Alerts []struct {
				Labels      map[string]string `json:"labels"`
				Annotations map[string]string `json:"annotations"`
				State       string            `json:"state"`
				ActiveAt    string            `json:"activeAt"`
			} `json:"alerts"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil
	}

	var alerts []gin.H
	for _, a := range result.Data.Alerts {
		if a.State == "firing" {
			alerts = append(alerts, gin.H{
				"name":     a.Labels["alertname"],
				"severity": a.Labels["severity"],
				"message":  a.Annotations["summary"],
				"since":    a.ActiveAt,
			})
		}
	}
	return alerts
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
