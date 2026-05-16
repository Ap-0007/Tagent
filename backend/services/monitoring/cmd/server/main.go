package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"

	"github.com/gin-gonic/gin"
)

var prometheusURL string

func init() {
	prometheusURL = envOr("PROMETHEUS_URL", "http://localhost:9090")
}

type MetricsSummary struct {
	ClusterCPUPercent float64            `json:"cluster_cpu_percent"`
	ClusterMemPercent float64            `json:"cluster_memory_percent"`
	PodMetrics       []PodMetric        `json:"pod_metrics"`
	NodeMetrics      []NodeMetric       `json:"node_metrics"`
	Alerts           []Alert            `json:"alerts"`
}

type PodMetric struct {
	Pod       string  `json:"pod"`
	Namespace string  `json:"namespace"`
	CPU       float64 `json:"cpu_cores"`
	Memory    float64 `json:"memory_bytes"`
}

type NodeMetric struct {
	Node      string  `json:"node"`
	CPUPct    float64 `json:"cpu_percent"`
	MemPct    float64 `json:"memory_percent"`
	DiskPct   float64 `json:"disk_percent"`
}

type Alert struct {
	Name     string `json:"name"`
	Severity string `json:"severity"`
	Message  string `json:"message"`
	Since    string `json:"since"`
}

func main() {
	port := envOr("PORT", "8082")

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "tagent-monitoring", "prometheus": prometheusURL})
	})

	router.GET("/summary", func(c *gin.Context) {
		summary := MetricsSummary{}

		// Query Prometheus for cluster CPU
		cpuResult := queryPrometheus(`100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)`)
		if len(cpuResult) > 0 {
			summary.ClusterCPUPercent = cpuResult[0]
		}

		// Query Prometheus for cluster memory
		memResult := queryPrometheus(`(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100`)
		if len(memResult) > 0 {
			summary.ClusterMemPercent = memResult[0]
		}

		// Query active alerts
		summary.Alerts = queryAlerts()

		c.JSON(200, summary)
	})

	router.GET("/metrics/cpu", func(c *gin.Context) {
		result := queryPrometheusRaw(`rate(container_cpu_usage_seconds_total{container!=""}[5m])`)
		c.Data(200, "application/json", result)
	})

	router.GET("/metrics/memory", func(c *gin.Context) {
		result := queryPrometheusRaw(`container_memory_working_set_bytes{container!=""}`)
		c.Data(200, "application/json", result)
	})

	log.Printf("Tagent Monitoring Service starting on port %s (Prometheus: %s)", port, prometheusURL)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start: %v", err)
	}
}

func queryPrometheus(query string) []float64 {
	u := fmt.Sprintf("%s/api/v1/query?query=%s", prometheusURL, url.QueryEscape(query))
	resp, err := http.Get(u)
	if err != nil {
		return nil
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
		return nil
	}

	var values []float64
	for _, r := range result.Data.Result {
		if len(r.Value) >= 2 {
			if v, ok := r.Value[1].(string); ok {
				var f float64
				fmt.Sscanf(v, "%f", &f)
				values = append(values, f)
			}
		}
	}
	return values
}

func queryPrometheusRaw(query string) []byte {
	u := fmt.Sprintf("%s/api/v1/query?query=%s", prometheusURL, url.QueryEscape(query))
	resp, err := http.Get(u)
	if err != nil {
		return []byte(`{"error":"prometheus unreachable"}`)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	return body
}

func queryAlerts() []Alert {
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

	var alerts []Alert
	for _, a := range result.Data.Alerts {
		if a.State == "firing" {
			alerts = append(alerts, Alert{
				Name:     a.Labels["alertname"],
				Severity: a.Labels["severity"],
				Message:  a.Annotations["summary"],
				Since:    a.ActiveAt,
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
