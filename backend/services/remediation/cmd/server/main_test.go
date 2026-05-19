package main

import (
	"context"
	"testing"
	"time"

	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/fake"
)

func TestNightGuardianDryRunDocumentsFinding(t *testing.T) {
	resetTestState()
	mode = "read-only"
	guardianConfig = GuardianConfig{
		Enabled:            true,
		AutoFix:            true,
		Confidence:         85,
		IntervalSeconds:    60,
		MinRestarts:        3,
		ProtectedNamespace: "kube-system",
	}
	client = fake.NewSimpleClientset(crashLoopPod("default", "api", 5))

	run, err := runGuardianScan(context.Background())
	if err != nil {
		t.Fatalf("runGuardianScan returned error: %v", err)
	}

	if run.Findings != 1 {
		t.Fatalf("expected 1 finding, got %d", run.Findings)
	}
	if run.Fixed != 0 {
		t.Fatalf("expected no live fixes in read-only mode, got %d", run.Fixed)
	}
	if len(run.Reports) != 1 {
		t.Fatalf("expected 1 report, got %d", len(run.Reports))
	}
	if !run.Reports[0].DryRun || run.Reports[0].Result.Status != "dry-run" {
		t.Fatalf("expected dry-run report result, got %+v", run.Reports[0])
	}
}

func TestNightGuardianAutoFixDeletesPodInAutoMode(t *testing.T) {
	resetTestState()
	mode = "auto"
	guardianConfig = GuardianConfig{
		Enabled:            true,
		AutoFix:            true,
		Confidence:         85,
		IntervalSeconds:    60,
		MinRestarts:        3,
		ProtectedNamespace: "kube-system",
	}
	client = fake.NewSimpleClientset(crashLoopPod("default", "api", 5))

	run, err := runGuardianScan(context.Background())
	if err != nil {
		t.Fatalf("runGuardianScan returned error: %v", err)
	}

	if run.Fixed != 1 {
		t.Fatalf("expected 1 fix, got %d", run.Fixed)
	}
	if run.Reports[0].DryRun {
		t.Fatalf("expected live action report, got dry-run")
	}
	pods, err := client.CoreV1().Pods("default").List(context.Background(), metav1.ListOptions{})
	if err != nil {
		t.Fatalf("list pods: %v", err)
	}
	if len(pods.Items) != 0 {
		t.Fatalf("expected pod to be deleted, got %d pods", len(pods.Items))
	}
}

func TestNightGuardianSkipsProtectedNamespace(t *testing.T) {
	resetTestState()
	mode = "auto"
	guardianConfig = GuardianConfig{
		Enabled:            true,
		AutoFix:            true,
		Confidence:         85,
		IntervalSeconds:    60,
		MinRestarts:        3,
		ProtectedNamespace: "kube-system",
	}
	client = fake.NewSimpleClientset(crashLoopPod("kube-system", "coredns", 8))

	run, err := runGuardianScan(context.Background())
	if err != nil {
		t.Fatalf("runGuardianScan returned error: %v", err)
	}
	if run.Findings != 0 {
		t.Fatalf("expected protected namespace to be skipped, got %d findings", run.Findings)
	}
}

func crashLoopPod(namespace, name string, restarts int32) *corev1.Pod {
	return &corev1.Pod{
		ObjectMeta: metav1.ObjectMeta{
			Name:              name,
			Namespace:         namespace,
			CreationTimestamp: metav1.NewTime(time.Now().Add(-10 * time.Minute)),
		},
		Spec: corev1.PodSpec{
			NodeName:   "node-1",
			Containers: []corev1.Container{{Name: "api"}},
		},
		Status: corev1.PodStatus{
			Phase: corev1.PodRunning,
			ContainerStatuses: []corev1.ContainerStatus{{
				Name:         "api",
				RestartCount: restarts,
				State: corev1.ContainerState{
					Waiting: &corev1.ContainerStateWaiting{Reason: "CrashLoopBackOff"},
				},
			}},
		},
	}
}

func resetTestState() {
	store = nil
	history = nil
	guardianRuns = nil
	reports = nil
}
