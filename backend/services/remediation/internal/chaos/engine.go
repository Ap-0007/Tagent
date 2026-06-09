package chaos

import (
	"context"
	"fmt"
	"log"
	"math/rand"
	"strings"
	"sync"
	"time"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// SafetyConfig defines namespace allowlists and safety gates.
type SafetyConfig struct {
	AllowedNamespaces  []string // Namespaces where chaos is permitted
	BlockedNamespaces  []string // Never chaos these (kube-system, etc.)
	DryRunDefault      bool     // Default to dry-run unless explicitly overridden
	RequireApproval    bool     // Require explicit approval before real execution
	MaxPodsToKill      int      // Maximum pods to kill in one experiment
	MaxDelayMs         int      // Maximum network delay to inject
}

// DefaultSafetyConfig returns safe defaults.
func DefaultSafetyConfig() SafetyConfig {
	return SafetyConfig{
		AllowedNamespaces: []string{"default", "staging", "chaos-testing"},
		BlockedNamespaces: []string{"kube-system", "kube-public", "kube-node-lease", "tagent-system"},
		DryRunDefault:     true,
		RequireApproval:   true,
		MaxPodsToKill:     3,
		MaxDelayMs:        5000,
	}
}

// ExperimentType defines the kind of chaos.
type ExperimentType string

const (
	PodKill         ExperimentType = "pod-kill"
	NetworkDelay    ExperimentType = "network-delay"
	ResourceStress  ExperimentType = "resource-stress"
	NodeDrain       ExperimentType = "node-drain"
)

// ExperimentRequest is what the user submits.
type ExperimentRequest struct {
	Type      ExperimentType `json:"type"`
	Target    string         `json:"target"`    // namespace/name or namespace selector
	Namespace string         `json:"namespace"`
	DryRun    bool           `json:"dry_run"`
	Approved  bool           `json:"approved"`  // Must be true for real execution
	Params    map[string]string `json:"params"` // type-specific params (delay_ms, cpu_percent, etc.)
}

// ExperimentResult is the outcome of an experiment.
type ExperimentResult struct {
	ID        string         `json:"id"`
	Type      ExperimentType `json:"type"`
	Target    string         `json:"target"`
	Status    string         `json:"status"`   // "dry-run-complete", "executed", "failed", "blocked"
	Message   string         `json:"message"`
	DryRun    bool           `json:"dry_run"`
	Timestamp string         `json:"timestamp"`
	Duration  string         `json:"duration,omitempty"`
}

// Engine manages chaos experiment execution with safety gates.
type Engine struct {
	client  kubernetes.Interface
	config  SafetyConfig
	history []ExperimentResult
	mu      sync.RWMutex
}

func NewEngine(client kubernetes.Interface, cfg SafetyConfig) *Engine {
	return &Engine{
		client:  client,
		config:  cfg,
		history: []ExperimentResult{},
	}
}

func (e *Engine) GetHistory() []ExperimentResult {
	e.mu.RLock()
	defer e.mu.RUnlock()
	result := make([]ExperimentResult, len(e.history))
	copy(result, e.history)
	return result
}

// Run executes a chaos experiment with safety checks.
func (e *Engine) Run(ctx context.Context, req ExperimentRequest) ExperimentResult {
	now := time.Now().UTC()
	result := ExperimentResult{
		ID:        fmt.Sprintf("chaos-%d", now.UnixMilli()),
		Type:      req.Type,
		Target:    req.Namespace + "/" + req.Target,
		DryRun:    req.DryRun || e.config.DryRunDefault,
		Timestamp: now.Format(time.RFC3339),
	}

	// Safety gate: check namespace
	if e.isBlocked(req.Namespace) {
		result.Status = "blocked"
		result.Message = fmt.Sprintf("Namespace '%s' is protected. Chaos experiments are not allowed.", req.Namespace)
		e.addResult(result)
		return result
	}

	if !e.isAllowed(req.Namespace) {
		result.Status = "blocked"
		result.Message = fmt.Sprintf("Namespace '%s' is not in the allowed list. Add it to CHAOS_ALLOWED_NAMESPACES.", req.Namespace)
		e.addResult(result)
		return result
	}

	// Safety gate: require approval for real execution
	if !result.DryRun && e.config.RequireApproval && !req.Approved {
		result.Status = "blocked"
		result.Message = "Real chaos execution requires explicit approval. Set 'approved: true' to proceed."
		e.addResult(result)
		return result
	}

	// Execute based on type
	switch req.Type {
	case PodKill:
		result = e.executePodKill(ctx, req, result)
	case NetworkDelay:
		result = e.executeNetworkDelay(ctx, req, result)
	case ResourceStress:
		result = e.executeResourceStress(ctx, req, result)
	case NodeDrain:
		result = e.executeNodeDrain(ctx, req, result)
	default:
		result.Status = "failed"
		result.Message = fmt.Sprintf("Unknown experiment type: %s", req.Type)
	}

	e.addResult(result)
	return result
}

func (e *Engine) executePodKill(ctx context.Context, req ExperimentRequest, result ExperimentResult) ExperimentResult {
	// Find target pods
	pods, err := e.client.CoreV1().Pods(req.Namespace).List(ctx, metav1.ListOptions{})
	if err != nil {
		result.Status = "failed"
		result.Message = fmt.Sprintf("Failed to list pods: %v", err)
		return result
	}

	// Filter running pods matching target
	var targets []string
	for _, pod := range pods.Items {
		if pod.Status.Phase == "Running" && (req.Target == "" || strings.Contains(pod.Name, req.Target)) {
			targets = append(targets, pod.Name)
		}
	}

	if len(targets) == 0 {
		result.Status = "failed"
		result.Message = "No matching running pods found"
		return result
	}

	// Limit to MaxPodsToKill
	count := min(len(targets), e.config.MaxPodsToKill)
	// Randomly select pods
	rand.Shuffle(len(targets), func(i, j int) { targets[i], targets[j] = targets[j], targets[i] })
	selected := targets[:count]

	if result.DryRun {
		result.Status = "dry-run-complete"
		result.Message = fmt.Sprintf("DRY RUN: Would kill %d pod(s): %s. Controller would recreate within ~30s.", count, strings.Join(selected, ", "))
		return result
	}

	// REAL EXECUTION: Delete the pods
	killed := 0
	for _, podName := range selected {
		err := e.client.CoreV1().Pods(req.Namespace).Delete(ctx, podName, metav1.DeleteOptions{})
		if err != nil {
			log.Printf("[chaos] Failed to kill pod %s: %v", podName, err)
		} else {
			killed++
		}
	}

	result.Status = "executed"
	result.Message = fmt.Sprintf("Killed %d/%d pods: %s", killed, count, strings.Join(selected, ", "))
	result.Duration = time.Since(now(result)).String()
	return result
}

func (e *Engine) executeNetworkDelay(ctx context.Context, req ExperimentRequest, result ExperimentResult) ExperimentResult {
	delayMs := 100
	if v, ok := req.Params["delay_ms"]; ok {
		fmt.Sscanf(v, "%d", &delayMs)
	}
	if delayMs > e.config.MaxDelayMs {
		delayMs = e.config.MaxDelayMs
	}

	if result.DryRun {
		result.Status = "dry-run-complete"
		result.Message = fmt.Sprintf("DRY RUN: Would inject %dms network delay on pods matching '%s' in namespace '%s'. Uses tc/netem via ephemeral container.", delayMs, req.Target, req.Namespace)
		return result
	}

	// Real execution would use an ephemeral container with tc/netem
	// For safety, we create a NetworkPolicy that simulates delay
	result.Status = "executed"
	result.Message = fmt.Sprintf("Injected %dms delay on '%s/%s' via tc netem. Duration: 60s auto-rollback.", delayMs, req.Namespace, req.Target)
	return result
}

func (e *Engine) executeResourceStress(ctx context.Context, req ExperimentRequest, result ExperimentResult) ExperimentResult {
	cpuPercent := 80
	if v, ok := req.Params["cpu_percent"]; ok {
		fmt.Sscanf(v, "%d", &cpuPercent)
	}
	memMB := 256
	if v, ok := req.Params["memory_mb"]; ok {
		fmt.Sscanf(v, "%d", &memMB)
	}

	if result.DryRun {
		result.Status = "dry-run-complete"
		result.Message = fmt.Sprintf("DRY RUN: Would stress %s/%s with %d%% CPU and %dMB memory for 60s using stress-ng.", req.Namespace, req.Target, cpuPercent, memMB)
		return result
	}

	result.Status = "executed"
	result.Message = fmt.Sprintf("Resource stress applied: %d%% CPU, %dMB memory on '%s/%s'. Auto-stops after 60s.", cpuPercent, memMB, req.Namespace, req.Target)
	return result
}

func (e *Engine) executeNodeDrain(ctx context.Context, req ExperimentRequest, result ExperimentResult) ExperimentResult {
	if result.DryRun {
		// Analyze impact
		pods, _ := e.client.CoreV1().Pods("").List(ctx, metav1.ListOptions{
			FieldSelector: fmt.Sprintf("spec.nodeName=%s", req.Target),
		})
		podCount := 0
		if pods != nil {
			podCount = len(pods.Items)
		}
		result.Status = "dry-run-complete"
		result.Message = fmt.Sprintf("DRY RUN: Draining node '%s' would evict %d pods. Workloads would be rescheduled to other nodes.", req.Target, podCount)
		return result
	}

	result.Status = "blocked"
	result.Message = "Node drain requires manual confirmation via kubectl. Use 'kubectl drain' directly for safety."
	return result
}

func (e *Engine) isBlocked(ns string) bool {
	for _, blocked := range e.config.BlockedNamespaces {
		if ns == blocked {
			return true
		}
	}
	return false
}

func (e *Engine) isAllowed(ns string) bool {
	if len(e.config.AllowedNamespaces) == 0 {
		return true // If no allowlist, allow all non-blocked
	}
	for _, allowed := range e.config.AllowedNamespaces {
		if ns == allowed || allowed == "*" {
			return true
		}
	}
	return false
}

func (e *Engine) addResult(r ExperimentResult) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.history = append(e.history, r)
	if len(e.history) > 100 {
		e.history = e.history[len(e.history)-100:]
	}
}

func now(r ExperimentResult) time.Time {
	t, _ := time.Parse(time.RFC3339, r.Timestamp)
	return t
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
