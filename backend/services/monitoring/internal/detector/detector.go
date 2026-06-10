package detector

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
)

// Incident represents a detected problem in the cluster.
type Incident struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Severity    string   `json:"severity"`
	Status      string   `json:"status"`
	Service     string   `json:"service"`
	Namespace   string   `json:"namespace"`
	Node        string   `json:"node"`
	RootCause   string   `json:"rootCause"`
	Confidence  int      `json:"confidence"`
	BlastRadius []string `json:"blastRadius"`
	Evidence    []string `json:"evidence"`
	StartedAt   string   `json:"startedAt"`
	DetectedAt  time.Time `json:"-"`
}

// Detector watches the cluster and detects incidents.
type Detector struct {
	client    *kubernetes.Clientset
	incidents []Incident
	mu        sync.RWMutex
	counter   int
	seen      map[string]time.Time // dedup key → first seen
}

func New(client *kubernetes.Clientset) *Detector {
	return &Detector{
		client:    client,
		incidents: []Incident{},
		seen:      make(map[string]time.Time),
	}
}

// GetIncidents returns all detected incidents.
func (d *Detector) GetIncidents() []Incident {
	d.mu.RLock()
	defer d.mu.RUnlock()
	result := make([]Incident, len(d.incidents))
	copy(result, d.incidents)
	return result
}

// RunLoop starts the detection loop. Scans every interval.
func (d *Detector) RunLoop(ctx context.Context, interval time.Duration) {
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	log.Printf("[detector] Starting incident detection loop (interval: %s)", interval)

	// Run immediately on start
	d.scan(ctx)

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			d.scan(ctx)
		}
	}
}

func (d *Detector) scan(ctx context.Context) {
	d.detectCrashLoopBackOff(ctx)
	d.detectOOMKilled(ctx)
	d.detectNodeNotReady(ctx)
}

// ===== Rule 1: CrashLoopBackOff =====
func (d *Detector) detectCrashLoopBackOff(ctx context.Context) {
	pods, err := d.client.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		log.Printf("[detector] Error listing pods: %v", err)
		return
	}

	for _, pod := range pods.Items {
		for _, cs := range pod.Status.ContainerStatuses {
			if cs.State.Waiting != nil && cs.State.Waiting.Reason == "CrashLoopBackOff" {
				key := fmt.Sprintf("crashloop:%s/%s", pod.Namespace, pod.Name)
				if d.isDuplicate(key) {
					continue
				}

				evidence := []string{
					fmt.Sprintf("Pod %s/%s container %s in CrashLoopBackOff", pod.Namespace, pod.Name, cs.Name),
					fmt.Sprintf("Restart count: %d", cs.RestartCount),
				}
				if cs.LastTerminationState.Terminated != nil {
					evidence = append(evidence, fmt.Sprintf("Last exit code: %d, reason: %s", cs.LastTerminationState.Terminated.ExitCode, cs.LastTerminationState.Terminated.Reason))
				}

				severity := "high"
				if cs.RestartCount > 10 {
					severity = "critical"
				}

				d.addIncident(Incident{
					Title:       fmt.Sprintf("%s CrashLoopBackOff (%d restarts)", pod.Name, cs.RestartCount),
					Severity:    severity,
					Status:      "active",
					Service:     podServiceName(pod),
					Namespace:   pod.Namespace,
					Node:        pod.Spec.NodeName,
					RootCause:   fmt.Sprintf("Container %s is crash-looping. Last exit code: %d.", cs.Name, lastExitCode(cs)),
					Confidence:  92,
					BlastRadius: []string{pod.Namespace + "/" + podServiceName(pod)},
					Evidence:    evidence,
				})
			}
		}
	}
}

// ===== Rule 2: OOMKilled =====
func (d *Detector) detectOOMKilled(ctx context.Context) {
	pods, err := d.client.CoreV1().Pods("").List(ctx, metav1.ListOptions{})
	if err != nil {
		return
	}

	for _, pod := range pods.Items {
		for _, cs := range pod.Status.ContainerStatuses {
			if cs.LastTerminationState.Terminated != nil && cs.LastTerminationState.Terminated.Reason == "OOMKilled" {
				key := fmt.Sprintf("oom:%s/%s:%s", pod.Namespace, pod.Name, cs.LastTerminationState.Terminated.FinishedAt.String())
				if d.isDuplicate(key) {
					continue
				}

				memLimit := "unknown"
				for _, c := range pod.Spec.Containers {
					if c.Name == cs.Name {
						if lim := c.Resources.Limits.Memory(); lim != nil {
							memLimit = lim.String()
						}
					}
				}

				d.addIncident(Incident{
					Title:     fmt.Sprintf("%s OOMKilled (memory limit: %s)", pod.Name, memLimit),
					Severity:  "high",
					Status:    "active",
					Service:   podServiceName(pod),
					Namespace: pod.Namespace,
					Node:      pod.Spec.NodeName,
					RootCause: fmt.Sprintf("Container %s exceeded memory limit (%s) and was killed by the kernel.", cs.Name, memLimit),
					Evidence: []string{
						fmt.Sprintf("Pod %s/%s container %s OOMKilled", pod.Namespace, pod.Name, cs.Name),
						fmt.Sprintf("Memory limit: %s", memLimit),
						fmt.Sprintf("Terminated at: %s", cs.LastTerminationState.Terminated.FinishedAt.Time.Format(time.RFC3339)),
					},
				})
			}
		}
	}
}

// ===== Rule 3: Node NotReady =====
func (d *Detector) detectNodeNotReady(ctx context.Context) {
	nodes, err := d.client.CoreV1().Nodes().List(ctx, metav1.ListOptions{})
	if err != nil {
		log.Printf("[detector] Error listing nodes: %v", err)
		return
	}

	for _, node := range nodes.Items {
		ready := false
		var lastTransition time.Time
		for _, cond := range node.Status.Conditions {
			if cond.Type == corev1.NodeReady {
				ready = cond.Status == corev1.ConditionTrue
				lastTransition = cond.LastTransitionTime.Time
			}
		}

		if !ready {
			key := fmt.Sprintf("node-notready:%s", node.Name)
			if d.isDuplicate(key) {
				continue
			}

			evidence := []string{
				fmt.Sprintf("Node %s is NotReady", node.Name),
				fmt.Sprintf("Last transition: %s", lastTransition.Format(time.RFC3339)),
			}

			// Check for common conditions
			for _, cond := range node.Status.Conditions {
				if cond.Status == corev1.ConditionTrue && cond.Type != corev1.NodeReady {
					evidence = append(evidence, fmt.Sprintf("Condition %s: %s", cond.Type, cond.Message))
				}
			}

			d.addIncident(Incident{
				Title:     fmt.Sprintf("Node %s NotReady", node.Name),
				Severity:  "critical",
				Status:    "active",
				Service:   "infrastructure",
				Namespace: "kube-system",
				Node:      node.Name,
				RootCause: fmt.Sprintf("Node %s is not ready. Pods on this node may be evicted.", node.Name),
				Evidence:  evidence,
			})
		}
	}
}

// ===== Helpers =====

func (d *Detector) addIncident(inc Incident) {
	d.mu.Lock()
	defer d.mu.Unlock()
	d.counter++
	inc.ID = fmt.Sprintf("INC-%04d", d.counter)
	inc.DetectedAt = time.Now().UTC()
	inc.StartedAt = inc.DetectedAt.Format(time.RFC3339)
	if inc.Confidence == 0 {
		inc.Confidence = 85
	}
	if inc.BlastRadius == nil {
		inc.BlastRadius = []string{}
	}
	d.incidents = append(d.incidents, inc)
	log.Printf("[detector] NEW INCIDENT: %s — %s (%s)", inc.ID, inc.Title, inc.Severity)
}

func (d *Detector) isDuplicate(key string) bool {
	d.mu.Lock()
	defer d.mu.Unlock()
	if _, exists := d.seen[key]; exists {
		return true
	}
	d.seen[key] = time.Now()
	return false
}

func podServiceName(pod corev1.Pod) string {
	if app, ok := pod.Labels["app"]; ok {
		return app
	}
	if app, ok := pod.Labels["app.kubernetes.io/name"]; ok {
		return app
	}
	return pod.Name
}

func lastExitCode(cs corev1.ContainerStatus) int32 {
	if cs.LastTerminationState.Terminated != nil {
		return cs.LastTerminationState.Terminated.ExitCode
	}
	return -1
}
