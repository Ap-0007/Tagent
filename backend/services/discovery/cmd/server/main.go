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
	"github.com/prometheus/client_golang/prometheus/promhttp"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"github.com/tagent-ai/tagent/backend/services/discovery/internal/cloud"
	"github.com/tagent-ai/tagent/backend/services/discovery/internal/cost"
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

	// Prometheus metrics
	router.GET("/metrics", gin.WrapH(promhttp.Handler()))

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

	// Auto-detect cluster name and environment from K8s context
	router.GET("/cluster-info", func(c *gin.Context) {
		stateLock.RLock()
		defer stateLock.RUnlock()

		// Detect cluster name from node labels or server URL
		clusterName := os.Getenv("CLUSTER_NAME")
		environment := os.Getenv("CLUSTER_ENVIRONMENT")

		if clusterName == "" && state != nil && len(state.Nodes) > 0 {
			// Try to extract from node provider ID (e.g., aws:///us-east-1a/i-xxx -> EKS)
			nodeName := state.Nodes[0].Name
			if strings.Contains(nodeName, "ip-") {
				clusterName = "eks-cluster"
				if environment == "" {
					environment = "production"
				}
			} else if strings.Contains(nodeName, "gke-") {
				clusterName = "gke-cluster"
				if environment == "" {
					environment = "production"
				}
			} else if strings.Contains(nodeName, "aks-") {
				clusterName = "aks-cluster"
				if environment == "" {
					environment = "production"
				}
			} else if strings.Contains(nodeName, "minikube") || strings.Contains(nodeName, "kind") || strings.Contains(nodeName, "docker-desktop") {
				clusterName = nodeName
				if environment == "" {
					environment = "development"
				}
			} else {
				clusterName = nodeName
				if environment == "" {
					environment = "production"
				}
			}
		}

		if clusterName == "" {
			clusterName = "default"
		}
		if environment == "" {
			environment = "production"
		}

		nodeCount := 0
		podCount := 0
		if state != nil {
			nodeCount = len(state.Nodes)
			podCount = int(state.Summary.TotalPods)
		}

		c.JSON(200, gin.H{
			"cluster_name": clusterName,
			"environment":  environment,
			"nodes":        nodeCount,
			"pods":         podCount,
			"provider":     detectProvider(state),
			"region":       os.Getenv("AWS_REGION"),
		})
	})

	router.GET("/nodes", func(c *gin.Context) {
		stateLock.RLock()
		defer stateLock.RUnlock()
		c.JSON(http.StatusOK, state.Nodes)
	})

	// GET /nodes/:name — Full node detail from K8s API (real data)
	router.GET("/nodes/:name", func(c *gin.Context) {
		nodeName := c.Param("name")
		ctx := c.Request.Context()

		// Get node from K8s API
		node, err := client.CoreV1().Nodes().Get(ctx, nodeName, metav1.GetOptions{})
		if err != nil {
			c.JSON(404, gin.H{"error": "node not found", "name": nodeName})
			return
		}

		// Basic info
		status := "NotReady"
		conditions := []gin.H{}
		for _, cond := range node.Status.Conditions {
			conditions = append(conditions, gin.H{
				"type":    string(cond.Type),
				"status":  string(cond.Status),
				"reason":  cond.Reason,
				"message": cond.Message,
			})
			if cond.Type == "Ready" && cond.Status == "True" {
				status = "Ready"
			}
		}

		role := "worker"
		if _, ok := node.Labels["node-role.kubernetes.io/control-plane"]; ok {
			role = "control-plane"
		} else if _, ok := node.Labels["node-role.kubernetes.io/master"]; ok {
			role = "master"
		}

		var intIP, extIP string
		for _, addr := range node.Status.Addresses {
			if addr.Type == "InternalIP" {
				intIP = addr.Address
			}
			if addr.Type == "ExternalIP" {
				extIP = addr.Address
			}
		}

		// Node info from status
		nodeInfo := node.Status.NodeInfo
		providerID := node.Spec.ProviderID
		podCIDR := node.Spec.PodCIDR

		// Instance type from labels
		instanceType := node.Labels["node.kubernetes.io/instance-type"]
		if instanceType == "" {
			instanceType = node.Labels["beta.kubernetes.io/instance-type"]
		}

		// AZ from labels
		az := node.Labels["topology.kubernetes.io/zone"]
		if az == "" {
			az = node.Labels["failure-domain.beta.kubernetes.io/zone"]
		}

		// Region from labels
		region := node.Labels["topology.kubernetes.io/region"]
		if region == "" {
			region = node.Labels["failure-domain.beta.kubernetes.io/region"]
		}

		// CPU & Memory usage from metrics-server
		cpuUsed := ""
		memUsed := ""
		cpuPercent := 0.0
		memPercent := 0.0
		if metrics != nil {
			nodeMetric, err := metrics.MetricsV1beta1().NodeMetricses().Get(ctx, nodeName, metav1.GetOptions{})
			if err == nil {
				cpuUsed = nodeMetric.Usage.Cpu().String()
				memUsed = nodeMetric.Usage.Memory().String()
				cpuCap := node.Status.Capacity.Cpu().AsApproximateFloat64()
				memCap := node.Status.Capacity.Memory().AsApproximateFloat64()
				if cpuCap > 0 {
					cpuPercent = (nodeMetric.Usage.Cpu().AsApproximateFloat64() / cpuCap) * 100
				}
				if memCap > 0 {
					memPercent = (nodeMetric.Usage.Memory().AsApproximateFloat64() / memCap) * 100
				}
			}
		}

		// Get pods on this node
		podList, err := client.CoreV1().Pods("").List(ctx, metav1.ListOptions{
			FieldSelector: "spec.nodeName=" + nodeName,
		})
		podCount := 0
		var pods []gin.H
		if err == nil {
			podCount = len(podList.Items)
			for _, p := range podList.Items {
				podStatus := string(p.Status.Phase)
				var restarts int32
				for _, cs := range p.Status.ContainerStatuses {
					restarts += cs.RestartCount
					if cs.State.Waiting != nil && cs.State.Waiting.Reason != "" {
						podStatus = cs.State.Waiting.Reason
					}
				}
				var cpuReq, memReq string
				for _, container := range p.Spec.Containers {
					if cpu, ok := container.Resources.Requests[corev1.ResourceCPU]; ok {
						cpuReq = cpu.String()
					}
					if mem, ok := container.Resources.Requests[corev1.ResourceMemory]; ok {
						memReq = mem.String()
					}
				}
				pods = append(pods, gin.H{
					"name":       p.Name,
					"namespace":  p.Namespace,
					"status":     podStatus,
					"cpu":        cpuReq,
					"memory":     memReq,
					"restarts":   restarts,
					"age":        time.Since(p.CreationTimestamp.Time).Round(time.Minute).String(),
					"containers": len(p.Spec.Containers),
				})
			}
		}
		if pods == nil {
			pods = []gin.H{}
		}

		// Labels & annotations
		labels := node.Labels
		annotations := node.Annotations

		// Taints
		var taints []gin.H
		for _, t := range node.Spec.Taints {
			taints = append(taints, gin.H{
				"key":    t.Key,
				"value":  t.Value,
				"effect": string(t.Effect),
			})
		}
		if taints == nil {
			taints = []gin.H{}
		}

		// Images cached
		var images []string
		for _, img := range node.Status.Images {
			if len(img.Names) > 0 {
				images = append(images, img.Names[len(img.Names)-1])
			}
		}

		// Events for this node
		events, _ := client.CoreV1().Events("").List(ctx, metav1.ListOptions{
			FieldSelector: fmt.Sprintf("involvedObject.name=%s,involvedObject.kind=Node", nodeName),
		})
		var nodeEvents []gin.H
		if events != nil {
			for _, ev := range events.Items {
				nodeEvents = append(nodeEvents, gin.H{
					"type":      ev.Type,
					"reason":    ev.Reason,
					"message":   ev.Message,
					"count":     ev.Count,
					"first":     ev.FirstTimestamp.Time.Format(time.RFC3339),
					"last":      ev.LastTimestamp.Time.Format(time.RFC3339),
					"component": ev.Source.Component,
				})
			}
		}
		if nodeEvents == nil {
			nodeEvents = []gin.H{}
		}

		c.JSON(200, gin.H{
			"name":               nodeName,
			"status":             status,
			"role":               role,
			"kubernetes_version": nodeInfo.KubeletVersion,
			"container_runtime":  nodeInfo.ContainerRuntimeVersion,
			"os":                 nodeInfo.OSImage,
			"os_type":            nodeInfo.OperatingSystem,
			"architecture":       nodeInfo.Architecture,
			"kernel":             nodeInfo.KernelVersion,
			"internal_ip":        intIP,
			"external_ip":        extIP,
			"pod_cidr":           podCIDR,
			"provider_id":        providerID,
			"instance_type":      instanceType,
			"availability_zone":  az,
			"region":             region,
			"created_at":         node.CreationTimestamp.Time.Format(time.RFC3339),
			"age":                time.Since(node.CreationTimestamp.Time).Round(time.Hour).String(),
			"cpu_capacity":       node.Status.Capacity.Cpu().String(),
			"memory_capacity":    node.Status.Capacity.Memory().String(),
			"pod_capacity":       node.Status.Capacity.Pods().String(),
			"ephemeral_storage":  node.Status.Capacity.StorageEphemeral().String(),
			"cpu_used":           cpuUsed,
			"cpu_percent":        int(cpuPercent),
			"memory_used":        memUsed,
			"memory_percent":     int(memPercent),
			"pod_count":          podCount,
			"pods":               pods,
			"conditions":         conditions,
			"labels":             labels,
			"annotations":        annotations,
			"taints":             taints,
			"images":             images,
			"image_count":        len(images),
			"events":             nodeEvents,
		})
	})

	// GET /nodes/:name/cloud — AWS EC2 instance details (real data from AWS API)
	router.GET("/nodes/:name/cloud", func(c *gin.Context) {
		nodeName := c.Param("name")
		ctx := c.Request.Context()

		// Get node to extract provider ID
		node, err := client.CoreV1().Nodes().Get(ctx, nodeName, metav1.GetOptions{})
		if err != nil {
			c.JSON(404, gin.H{"error": "node not found", "name": nodeName})
			return
		}

		providerID := node.Spec.ProviderID
		instanceID := cloud.ParseInstanceIDFromProviderID(providerID)
		if instanceID == "" {
			c.JSON(200, gin.H{
				"available": false,
				"message":   "Not an AWS EC2 instance or ProviderID not set",
				"provider_id": providerID,
			})
			return
		}

		// Initialize AWS client
		awsClient, err := cloud.NewAWSClient()
		if err != nil {
			c.JSON(200, gin.H{
				"available": false,
				"message":   fmt.Sprintf("AWS SDK not configured: %v", err),
				"instance_id": instanceID,
			})
			return
		}

		detail, err := awsClient.GetInstanceDetail(ctx, instanceID)
		if err != nil {
			c.JSON(200, gin.H{
				"available":   false,
				"message":     fmt.Sprintf("Failed to fetch EC2 details: %v", err),
				"instance_id": instanceID,
			})
			return
		}

		// Also get status checks
		statusChecks := awsClient.GetInstanceStatus(ctx, instanceID)
		detail.StatusChecks = statusChecks

		c.JSON(200, gin.H{
			"available": true,
			"instance":  detail,
		})
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

	// Cost estimation — real cloud billing API or node-capacity fallback
	router.GET("/cost/summary", func(c *gin.Context) {
		// Try real cloud billing provider first
		costProvider := cost.DetectProvider()
		if costProvider != nil && costProvider.IsConfigured() {
			summary, err := costProvider.FetchCosts(c.Request.Context())
			if err == nil {
				c.JSON(200, summary)
				return
			}
			log.Printf("[cost] Cloud provider %s failed, falling back to estimation: %v", costProvider.Name(), err)
		}

		// Fallback: estimate from node capacity
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
			"source":           "estimated",
			"last_updated":     time.Now().UTC().Format(time.RFC3339),
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

// detectProvider auto-detects the cloud provider from node names
func detectProvider(state *scanner.ClusterState) string {
	if state == nil || len(state.Nodes) == 0 {
		return "unknown"
	}
	nodeName := state.Nodes[0].Name
	if strings.Contains(nodeName, "ip-") {
		return "aws"
	}
	if strings.Contains(nodeName, "gke-") {
		return "gcp"
	}
	if strings.Contains(nodeName, "aks-") {
		return "azure"
	}
	if strings.Contains(nodeName, "minikube") {
		return "minikube"
	}
	if strings.Contains(nodeName, "kind") {
		return "kind"
	}
	return "self-hosted"
}
