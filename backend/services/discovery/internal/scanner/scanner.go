package scanner

import (
	"context"
	"fmt"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	metricsv "k8s.io/metrics/pkg/client/clientset/versioned"
)

// ClusterState holds the full snapshot of the cluster.
type ClusterState struct {
	ScannedAt   string       `json:"scanned_at"`
	Nodes       []NodeInfo   `json:"nodes"`
	Pods        []PodInfo    `json:"pods"`
	Deployments []DeployInfo `json:"deployments"`
	Services    []SvcInfo    `json:"services"`
	Namespaces  []string     `json:"namespaces"`
	Summary     Summary      `json:"summary"`
}

type Summary struct {
	TotalNodes       int `json:"total_nodes"`
	ReadyNodes       int `json:"ready_nodes"`
	TotalPods        int `json:"total_pods"`
	RunningPods      int `json:"running_pods"`
	FailedPods       int `json:"failed_pods"`
	TotalDeployments int `json:"total_deployments"`
	TotalServices    int `json:"total_services"`
}

type NodeInfo struct {
	Name       string `json:"name"`
	Status     string `json:"status"`
	Role       string `json:"role"`
	CPUCap     string `json:"cpu_capacity"`
	MemCap     string `json:"memory_capacity"`
	PodCap     string `json:"pod_capacity"`
	CPUUsed    string `json:"cpu_used"`
	MemUsed    string `json:"memory_used"`
	PodCount   int    `json:"pod_count"`
	InternalIP string `json:"internal_ip"`
	ExternalIP string `json:"external_ip"`
	Age        string `json:"age"`
}

type PodInfo struct {
	Name       string `json:"name"`
	Namespace  string `json:"namespace"`
	Status     string `json:"status"`
	Restarts   int32  `json:"restarts"`
	CPUReq     string `json:"cpu_request"`
	MemReq     string `json:"memory_request"`
	CPUUsed    string `json:"cpu_used"`
	MemUsed    string `json:"memory_used"`
	Node       string `json:"node"`
	Age        string `json:"age"`
	Containers int    `json:"containers"`
}

type DeployInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Replicas  int32  `json:"replicas"`
	Ready     int32  `json:"ready"`
	Available int32  `json:"available"`
	Age       string `json:"age"`
}

type SvcInfo struct {
	Name      string `json:"name"`
	Namespace string `json:"namespace"`
	Type      string `json:"type"`
	ClusterIP string `json:"cluster_ip"`
	Ports     string `json:"ports"`
}

// Scanner scans the Kubernetes cluster.
type Scanner struct {
	client  kubernetes.Interface
	metrics *metricsv.Clientset
}

func New(client kubernetes.Interface, metrics *metricsv.Clientset) *Scanner {
	return &Scanner{client: client, metrics: metrics}
}

// Scan performs a full cluster scan and returns the state.
func (s *Scanner) Scan(ctx context.Context) (*ClusterState, error) {
	state := &ClusterState{
		ScannedAt:   time.Now().UTC().Format(time.RFC3339),
		Nodes:       []NodeInfo{},
		Pods:        []PodInfo{},
		Deployments: []DeployInfo{},
		Services:    []SvcInfo{},
		Namespaces:  []string{},
	}

	podMetrics := map[string]map[string]PodUsage{}
	nodeMetrics := map[string]NodeUsage{}
	if s.metrics != nil {
		podMetrics = s.fetchPodMetrics(ctx)
		nodeMetrics = s.fetchNodeMetrics(ctx)
	}

	// Namespaces
	nsList, err := s.client.CoreV1().Namespaces().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list namespaces: %w", err)
	}
	for _, ns := range nsList.Items {
		state.Namespaces = append(state.Namespaces, ns.Name)
	}

	// Nodes
	nodeList, err := s.client.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list nodes: %w", err)
	}
	for _, n := range nodeList.Items {
		status := "NotReady"
		for _, c := range n.Status.Conditions {
			if c.Type == "Ready" && c.Status == "True" {
				status = "Ready"
				state.Summary.ReadyNodes++
			}
		}
		role := "worker"
		if _, ok := n.Labels["node-role.kubernetes.io/control-plane"]; ok {
			role = "control-plane"
		}
		var intIP, extIP string
		for _, addr := range n.Status.Addresses {
			if addr.Type == "InternalIP" {
				intIP = addr.Address
			}
			if addr.Type == "ExternalIP" {
				extIP = addr.Address
			}
		}
		podCount := 0
		for _, p := range state.Pods {
			if p.Node == n.Name {
				podCount++
			}
		}
		usage := nodeMetrics[n.Name]
		state.Nodes = append(state.Nodes, NodeInfo{
			Name:       n.Name,
			Status:     status,
			Role:       role,
			CPUCap:     n.Status.Capacity.Cpu().String(),
			MemCap:     n.Status.Capacity.Memory().String(),
			PodCap:     n.Status.Capacity.Pods().String(),
			CPUUsed:    usage.CPU,
			MemUsed:    usage.Memory,
			PodCount:   podCount,
			InternalIP: intIP,
			ExternalIP: extIP,
			Age:        time.Since(n.CreationTimestamp.Time).Round(time.Hour).String(),
		})
	}
	state.Summary.TotalNodes = len(nodeList.Items)

	// Pods (all namespaces)
	podList, err := s.client.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list pods: %w", err)
	}
	for _, p := range podList.Items {
		status := string(p.Status.Phase)
		var restarts int32
		for _, cs := range p.Status.ContainerStatuses {
			restarts += cs.RestartCount
			if cs.State.Waiting != nil && cs.State.Waiting.Reason != "" {
				status = cs.State.Waiting.Reason
			}
		}
		var cpuReq, memReq string
		var cpuUsed, memUsed string
		for _, c := range p.Spec.Containers {
			if cpu, ok := c.Resources.Requests[corev1.ResourceCPU]; ok {
				cpuReq = addQuantityStrings(cpuReq, cpu.String())
			}
			if mem, ok := c.Resources.Requests[corev1.ResourceMemory]; ok {
				memReq = addQuantityStrings(memReq, mem.String())
			}
			if usage, ok := podMetrics[p.Namespace+"/"+p.Name][c.Name]; ok {
				cpuUsed = addQuantityStrings(cpuUsed, usage.CPU)
				memUsed = addQuantityStrings(memUsed, usage.Memory)
			}
		}
		if status == "Running" {
			state.Summary.RunningPods++
		} else if !isHealthyPodStatus(status) {
			state.Summary.FailedPods++
		}
		state.Pods = append(state.Pods, PodInfo{
			Name:       p.Name,
			Namespace:  p.Namespace,
			Status:     status,
			Restarts:   restarts,
			CPUReq:     cpuReq,
			MemReq:     memReq,
			CPUUsed:    cpuUsed,
			MemUsed:    memUsed,
			Node:       p.Spec.NodeName,
			Age:        time.Since(p.CreationTimestamp.Time).Round(time.Minute).String(),
			Containers: len(p.Spec.Containers),
		})
	}
	state.Summary.TotalPods = len(podList.Items)

	nodePodCounts := map[string]int{}
	for _, p := range state.Pods {
		if p.Node != "" {
			nodePodCounts[p.Node]++
		}
	}
	for i := range state.Nodes {
		state.Nodes[i].PodCount = nodePodCounts[state.Nodes[i].Name]
	}

	// Deployments (all namespaces)
	depList, err := s.client.AppsV1().Deployments("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list deployments: %w", err)
	}
	for _, d := range depList.Items {
		replicas := int32(1)
		if d.Spec.Replicas != nil {
			replicas = *d.Spec.Replicas
		}
		state.Deployments = append(state.Deployments, DeployInfo{
			Name:      d.Name,
			Namespace: d.Namespace,
			Replicas:  replicas,
			Ready:     d.Status.ReadyReplicas,
			Available: d.Status.AvailableReplicas,
			Age:       time.Since(d.CreationTimestamp.Time).Round(time.Hour).String(),
		})
	}
	state.Summary.TotalDeployments = len(depList.Items)

	// Services (all namespaces)
	svcList, err := s.client.CoreV1().Services("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return nil, fmt.Errorf("list services: %w", err)
	}
	for _, svc := range svcList.Items {
		ports := ""
		for i, p := range svc.Spec.Ports {
			if i > 0 {
				ports += ", "
			}
			ports += fmt.Sprintf("%d/%s", p.Port, p.Protocol)
		}
		state.Services = append(state.Services, SvcInfo{
			Name:      svc.Name,
			Namespace: svc.Namespace,
			Type:      string(svc.Spec.Type),
			ClusterIP: svc.Spec.ClusterIP,
			Ports:     ports,
		})
	}
	state.Summary.TotalServices = len(svcList.Items)

	return state, nil
}

type PodUsage struct {
	CPU    string
	Memory string
}

type NodeUsage struct {
	CPU    string
	Memory string
}

func (s *Scanner) fetchPodMetrics(ctx context.Context) map[string]map[string]PodUsage {
	result := map[string]map[string]PodUsage{}
	metrics, err := s.metrics.MetricsV1beta1().PodMetricses("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return result
	}
	for _, pod := range metrics.Items {
		key := pod.Namespace + "/" + pod.Name
		result[key] = map[string]PodUsage{}
		for _, container := range pod.Containers {
			result[key][container.Name] = PodUsage{
				CPU:    container.Usage.Cpu().String(),
				Memory: container.Usage.Memory().String(),
			}
		}
	}
	return result
}

func (s *Scanner) fetchNodeMetrics(ctx context.Context) map[string]NodeUsage {
	result := map[string]NodeUsage{}
	metrics, err := s.metrics.MetricsV1beta1().NodeMetricses().List(ctx, metav1.ListOptions{})
	if err != nil {
		return result
	}
	for _, node := range metrics.Items {
		result[node.Name] = NodeUsage{
			CPU:    node.Usage.Cpu().String(),
			Memory: node.Usage.Memory().String(),
		}
	}
	return result
}

func addQuantityStrings(current, next string) string {
	if current == "" {
		return next
	}
	if next == "" {
		return current
	}
	return current + "+" + next
}

func isHealthyPodStatus(status string) bool {
	return status == "Running" || status == "Succeeded" || status == "Completed"
}
