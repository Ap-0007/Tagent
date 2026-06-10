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
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"github.com/tagent-ai/tagent/backend/shared/pkg/events"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"

	"github.com/tagent-ai/tagent/backend/services/monitoring/internal/detector"
	"github.com/tagent-ai/tagent/backend/services/monitoring/internal/loki"
	"github.com/tagent-ai/tagent/backend/services/monitoring/internal/tracing"
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

	// Network I/O metrics (from Prometheus node_network_* metrics)
	router.GET("/metrics/network", func(c *gin.Context) {
		// Query network receive/transmit bytes rate per node
		rxBytesPerSec := queryPromSingle(`sum(rate(node_network_receive_bytes_total{device!~"lo|veth.*|docker.*|br-.*"}[5m]))`)
		txBytesPerSec := queryPromSingle(`sum(rate(node_network_transmit_bytes_total{device!~"lo|veth.*|docker.*|br-.*"}[5m]))`)
		rxPacketsPerSec := queryPromSingle(`sum(rate(node_network_receive_packets_total{device!~"lo|veth.*|docker.*|br-.*"}[5m]))`)
		txPacketsPerSec := queryPromSingle(`sum(rate(node_network_transmit_packets_total{device!~"lo|veth.*|docker.*|br-.*"}[5m]))`)
		rxErrors := queryPromSingle(`sum(rate(node_network_receive_errs_total{device!~"lo|veth.*|docker.*|br-.*"}[5m]))`)
		txErrors := queryPromSingle(`sum(rate(node_network_transmit_errs_total{device!~"lo|veth.*|docker.*|br-.*"}[5m]))`)
		rxDropped := queryPromSingle(`sum(rate(node_network_receive_drop_total{device!~"lo|veth.*|docker.*|br-.*"}[5m]))`)
		txDropped := queryPromSingle(`sum(rate(node_network_transmit_drop_total{device!~"lo|veth.*|docker.*|br-.*"}[5m]))`)

		// Per-node breakdown
		nodeNetRx := queryPromVector(`sum by (instance) (rate(node_network_receive_bytes_total{device!~"lo|veth.*|docker.*|br-.*"}[5m]))`)
		nodeNetTx := queryPromVector(`sum by (instance) (rate(node_network_transmit_bytes_total{device!~"lo|veth.*|docker.*|br-.*"}[5m]))`)

		// Format bandwidth
		totalBandwidth := rxBytesPerSec + txBytesPerSec
		bandwidthStr := formatBytes(totalBandwidth) + "/s"

		c.JSON(200, gin.H{
			"total_bandwidth":       bandwidthStr,
			"receive_bytes_per_sec": rxBytesPerSec,
			"transmit_bytes_per_sec": txBytesPerSec,
			"receive_packets_per_sec": rxPacketsPerSec,
			"transmit_packets_per_sec": txPacketsPerSec,
			"receive_errors_per_sec": rxErrors,
			"transmit_errors_per_sec": txErrors,
			"receive_dropped_per_sec": rxDropped,
			"transmit_dropped_per_sec": txDropped,
			"node_receive": nodeNetRx,
			"node_transmit": nodeNetTx,
		})
	})

	// Service Mesh Traffic Telemetry (Istio/Envoy/Prometheus)
	router.GET("/metrics/traffic", func(c *gin.Context) {
		// Total request rate (requests/sec) from Istio or generic HTTP metrics
		requestsPerSec := queryPromSingle(`sum(rate(istio_requests_total[5m]))`)
		if requestsPerSec == 0 {
			// Fallback: try generic container HTTP metrics
			requestsPerSec = queryPromSingle(`sum(rate(http_requests_total[5m]))`)
		}

		// Error rate (5xx responses)
		errorsPerSec := queryPromSingle(`sum(rate(istio_requests_total{response_code=~"5.."}[5m]))`)
		if errorsPerSec == 0 {
			errorsPerSec = queryPromSingle(`sum(rate(http_requests_total{code=~"5.."}[5m]))`)
		}

		// P50, P95, P99 latency from Istio histograms
		p50Latency := queryPromSingle(`histogram_quantile(0.50, sum(rate(istio_request_duration_milliseconds_bucket[5m])) by (le))`)
		p95Latency := queryPromSingle(`histogram_quantile(0.95, sum(rate(istio_request_duration_milliseconds_bucket[5m])) by (le))`)
		p99Latency := queryPromSingle(`histogram_quantile(0.99, sum(rate(istio_request_duration_milliseconds_bucket[5m])) by (le))`)

		// Fallback to request_duration_seconds if Istio metrics not available
		if p95Latency == 0 {
			p95Latency = queryPromSingle(`histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`) * 1000
			p99Latency = queryPromSingle(`histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`) * 1000
			p50Latency = queryPromSingle(`histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))`) * 1000
		}

		// Per-service breakdown
		serviceTraffic := queryPromVector(`sum by (destination_service_name) (rate(istio_requests_total[5m]))`)

		// Success rate
		totalReqs := queryPromSingle(`sum(rate(istio_requests_total[5m]))`)
		successReqs := queryPromSingle(`sum(rate(istio_requests_total{response_code=~"2.."}[5m]))`)
		successRate := 0.0
		if totalReqs > 0 {
			successRate = (successReqs / totalReqs) * 100
		}

		// Throughput in bytes/sec
		throughput := queryPromSingle(`sum(rate(istio_tcp_sent_bytes_total[5m])) + sum(rate(istio_tcp_received_bytes_total[5m]))`)

		c.JSON(200, gin.H{
			"requests_per_sec":  requestsPerSec,
			"errors_per_sec":    errorsPerSec,
			"error_rate_percent": func() float64 { if requestsPerSec > 0 { return (errorsPerSec / requestsPerSec) * 100 }; return 0 }(),
			"p50_latency_ms":    p50Latency,
			"p95_latency_ms":    p95Latency,
			"p99_latency_ms":    p99Latency,
			"success_rate":      successRate,
			"throughput_bytes":   throughput,
			"throughput":         formatBytes(throughput) + "/s",
			"service_traffic":    serviceTraffic,
		})
	})

	// Incidents detected by the rules engine
	router.GET("/incidents", func(c *gin.Context) {
		incidents := det.GetIncidents()
		c.JSON(200, gin.H{"incidents": incidents, "total": len(incidents)})
	})

	// Node Metrics History (time-series for graphs)
	router.GET("/metrics/node/:name", func(c *gin.Context) {
		nodeName := c.Param("name")
		rangeParam := c.DefaultQuery("range", "1h")

		// Parse range to Prometheus range parameters
		var duration string
		var step string
		switch rangeParam {
		case "1h":
			duration = "1h"
			step = "60"
		case "3h":
			duration = "3h"
			step = "120"
		case "12h":
			duration = "12h"
			step = "300"
		case "1d":
			duration = "24h"
			step = "600"
		case "3d":
			duration = "72h"
			step = "1800"
		case "1w":
			duration = "168h"
			step = "3600"
		default:
			duration = "1h"
			step = "60"
		}

		end := time.Now()
		parsedDur, _ := time.ParseDuration(duration)
		start := end.Add(-parsedDur)

		// Build queries using node name or IP
		// K8s node names often match Prometheus instance labels (ip-x-x-x-x)
		// We need to find the node's internal IP first
		nodeIP := nodeName
		// Try to extract IP from the node name for EKS nodes (ip-10-0-3-126.ap-south-1.compute.internal)
		if strings.Contains(nodeName, "ip-") {
			parts := strings.Split(nodeName, ".")
			if len(parts) > 0 {
				ipPart := strings.TrimPrefix(parts[0], "ip-")
				ipPart = strings.ReplaceAll(ipPart, "-", ".")
				nodeIP = ipPart
			}
		}

		// Instance selector: match by node IP (Prometheus node_exporter typically uses IP:port)
		instanceFilter := fmt.Sprintf(`instance=~"%s.*"`, nodeIP)

		// CPU Utilization
		cpuQuery := fmt.Sprintf(`100 - (avg by(instance)(rate(node_cpu_seconds_total{mode="idle",%s}[5m])) * 100)`, instanceFilter)
		cpuData := queryPromRange(cpuQuery, start, end, step)

		// Memory Utilization
		memQuery := fmt.Sprintf(`(1 - node_memory_MemAvailable_bytes{%s} / node_memory_MemTotal_bytes{%s}) * 100`, instanceFilter, instanceFilter)
		memData := queryPromRange(memQuery, start, end, step)

		// Network In (bytes/sec)
		netInQuery := fmt.Sprintf(`sum(rate(node_network_receive_bytes_total{%s,device!~"lo|veth.*|docker.*|br-.*"}[5m]))`, instanceFilter)
		netInData := queryPromRange(netInQuery, start, end, step)

		// Network Out (bytes/sec)
		netOutQuery := fmt.Sprintf(`sum(rate(node_network_transmit_bytes_total{%s,device!~"lo|veth.*|docker.*|br-.*"}[5m]))`, instanceFilter)
		netOutData := queryPromRange(netOutQuery, start, end, step)

		// Network Packets In
		netPktInQuery := fmt.Sprintf(`sum(rate(node_network_receive_packets_total{%s,device!~"lo|veth.*|docker.*|br-.*"}[5m]))`, instanceFilter)
		netPktInData := queryPromRange(netPktInQuery, start, end, step)

		// Network Packets Out
		netPktOutQuery := fmt.Sprintf(`sum(rate(node_network_transmit_packets_total{%s,device!~"lo|veth.*|docker.*|br-.*"}[5m]))`, instanceFilter)
		netPktOutData := queryPromRange(netPktOutQuery, start, end, step)

		// Disk Read IOPS
		diskReadQuery := fmt.Sprintf(`sum(rate(node_disk_reads_completed_total{%s}[5m]))`, instanceFilter)
		diskReadData := queryPromRange(diskReadQuery, start, end, step)

		// Disk Write IOPS
		diskWriteQuery := fmt.Sprintf(`sum(rate(node_disk_writes_completed_total{%s}[5m]))`, instanceFilter)
		diskWriteData := queryPromRange(diskWriteQuery, start, end, step)

		// Disk Usage Percent
		diskUsageQuery := fmt.Sprintf(`(1 - node_filesystem_avail_bytes{%s,mountpoint="/"} / node_filesystem_size_bytes{%s,mountpoint="/"}) * 100`, instanceFilter, instanceFilter)
		diskUsageData := queryPromRange(diskUsageQuery, start, end, step)

		// Metadata no token (for CloudWatch-like metric)
		metadataQuery := fmt.Sprintf(`sum(rate(node_network_receive_bytes_total{%s,device="lo"}[5m]))`, instanceFilter)
		metadataData := queryPromRange(metadataQuery, start, end, step)

		// CPU Credit Usage (T-type instances, from CloudWatch agent)
		cpuCreditUsageQuery := fmt.Sprintf(`node_cpu_guest_seconds_total{%s}`, instanceFilter)
		cpuCreditUsageData := queryPromRange(cpuCreditUsageQuery, start, end, step)

		// CPU Credit Balance
		cpuCreditBalanceQuery := fmt.Sprintf(`node_cpu_seconds_total{mode="steal",%s}`, instanceFilter)
		cpuCreditBalanceData := queryPromRange(cpuCreditBalanceQuery, start, end, step)

		c.JSON(200, gin.H{
			"node":               nodeName,
			"range":              rangeParam,
			"cpu_utilization":    cpuData,
			"memory_utilization": memData,
			"network_in_bytes":   netInData,
			"network_out_bytes":  netOutData,
			"network_packets_in": netPktInData,
			"network_packets_out": netPktOutData,
			"disk_read_iops":     diskReadData,
			"disk_write_iops":    diskWriteData,
			"disk_usage_percent": diskUsageData,
			"metadata_no_token":  metadataData,
			"cpu_credit_usage":   cpuCreditUsageData,
			"cpu_credit_balance": cpuCreditBalanceData,
		})
	})

	// Log Search (Loki integration with K8s fallback)
	router.POST("/logs/search", func(c *gin.Context) {
		var req struct {
			Query     string `json:"query"`
			Namespace string `json:"namespace"`
			Start     string `json:"start"`
			End       string `json:"end"`
			Limit     int    `json:"limit"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		start := time.Now().Add(-1 * time.Hour)
		end := time.Now()
		if req.Start != "" {
			if t, err := time.Parse(time.RFC3339, req.Start); err == nil {
				start = t
			}
		}
		if req.End != "" {
			if t, err := time.Parse(time.RFC3339, req.End); err == nil {
				end = t
			}
		}
		if req.Limit <= 0 {
			req.Limit = 100
		}

		// Try Loki first
		lokiClient := loki.New()
		if lokiClient.IsConfigured() {
			result, err := lokiClient.Search(c.Request.Context(), req.Query, req.Namespace, start, end, req.Limit)
			if err == nil {
				c.JSON(200, result)
				return
			}
			log.Printf("[logs] Loki search failed, falling back to K8s: %v", err)
		}

		// Fallback: K8s pod logs (limited)
		c.JSON(200, gin.H{
			"entries": []gin.H{},
			"total":   0,
			"query":   req.Query,
			"source":  "kubernetes-fallback",
			"message": "Loki not configured. Configure LOKI_URL for historical log search.",
		})
	})

	// Distributed Tracing (Jaeger integration)
	jaegerClient := tracing.New()

	router.GET("/traces", func(c *gin.Context) {
		if !jaegerClient.IsConfigured() {
			c.JSON(200, gin.H{"traces": []gin.H{}, "total": 0, "source": "unavailable", "message": "Jaeger not configured. Set JAEGER_QUERY_URL."})
			return
		}
		service := c.Query("service")
		operation := c.Query("operation")
		minDuration := c.Query("minDuration")
		limit := 20
		start := time.Now().Add(-1 * time.Hour)
		end := time.Now()

		result, err := jaegerClient.SearchTraces(c.Request.Context(), service, operation, minDuration, limit, start, end)
		if err != nil {
			c.JSON(502, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, result)
	})

	router.GET("/traces/:id", func(c *gin.Context) {
		if !jaegerClient.IsConfigured() {
			c.JSON(503, gin.H{"error": "Jaeger not configured"})
			return
		}
		trace, err := jaegerClient.GetTrace(c.Request.Context(), c.Param("id"))
		if err != nil {
			c.JSON(404, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, trace)
	})

	router.GET("/traces/services", func(c *gin.Context) {
		if !jaegerClient.IsConfigured() {
			c.JSON(200, gin.H{"services": []string{}, "source": "unavailable"})
			return
		}
		services, err := jaegerClient.GetServices(c.Request.Context())
		if err != nil {
			c.JSON(502, gin.H{"error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"services": services, "source": "jaeger"})
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

// queryPromVector returns a map of label → value from a Prometheus vector query.
func queryPromVector(query string) []gin.H {
	u := fmt.Sprintf("%s/api/v1/query?query=%s", prometheusURL, url.QueryEscape(query))
	resp, err := http.Get(u)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	var result struct {
		Data struct {
			Result []struct {
				Metric map[string]string `json:"metric"`
				Value  []interface{}     `json:"value"`
			} `json:"result"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil
	}

	var items []gin.H
	for _, r := range result.Data.Result {
		val := 0.0
		if len(r.Value) >= 2 {
			if v, ok := r.Value[1].(string); ok {
				fmt.Sscanf(v, "%f", &val)
			}
		}
		instance := r.Metric["instance"]
		if instance == "" {
			instance = r.Metric["node"]
		}
		items = append(items, gin.H{
			"node":           instance,
			"bytes_per_sec":  val,
			"formatted":      formatBytes(val) + "/s",
		})
	}
	return items
}

// formatBytes formats bytes into human-readable string (KB, MB, GB, TB).
func formatBytes(bytes float64) string {
	if bytes >= 1e12 {
		return fmt.Sprintf("%.1f TB", bytes/1e12)
	}
	if bytes >= 1e9 {
		return fmt.Sprintf("%.1f GB", bytes/1e9)
	}
	if bytes >= 1e6 {
		return fmt.Sprintf("%.1f MB", bytes/1e6)
	}
	if bytes >= 1e3 {
		return fmt.Sprintf("%.1f KB", bytes/1e3)
	}
	return fmt.Sprintf("%.0f B", bytes)
}

// queryPromRange executes a Prometheus range query and returns time-series data points.
func queryPromRange(query string, start, end time.Time, step string) []gin.H {
	u := fmt.Sprintf("%s/api/v1/query_range?query=%s&start=%d&end=%d&step=%s",
		prometheusURL,
		url.QueryEscape(query),
		start.Unix(),
		end.Unix(),
		step,
	)
	resp, err := http.Get(u)
	if err != nil {
		return []gin.H{}
	}
	defer resp.Body.Close()

	var result struct {
		Data struct {
			Result []struct {
				Values [][]interface{} `json:"values"`
			} `json:"result"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return []gin.H{}
	}
	if len(result.Data.Result) == 0 {
		return []gin.H{}
	}

	var points []gin.H
	for _, v := range result.Data.Result[0].Values {
		if len(v) >= 2 {
			timestamp := 0.0
			if ts, ok := v[0].(float64); ok {
				timestamp = ts
			}
			value := 0.0
			if val, ok := v[1].(string); ok {
				fmt.Sscanf(val, "%f", &value)
			}
			points = append(points, gin.H{
				"timestamp": time.Unix(int64(timestamp), 0).UTC().Format(time.RFC3339),
				"value":     value,
			})
		}
	}
	if points == nil {
		points = []gin.H{}
	}
	return points
}
