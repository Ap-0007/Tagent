package scanner

import (
	"context"
	"testing"
	"time"

	appsv1 "k8s.io/api/apps/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes/fake"
)

func TestScanBuildsClusterState(t *testing.T) {
	replicas := int32(3)
	client := fake.NewSimpleClientset(
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "default"}},
		&corev1.Node{
			ObjectMeta: metav1.ObjectMeta{
				Name:              "node-1",
				CreationTimestamp: metav1.NewTime(time.Now().Add(-2 * time.Hour)),
				Labels:            map[string]string{"node-role.kubernetes.io/control-plane": ""},
			},
			Status: corev1.NodeStatus{
				Conditions: []corev1.NodeCondition{{Type: corev1.NodeReady, Status: corev1.ConditionTrue}},
				Addresses:  []corev1.NodeAddress{{Type: corev1.NodeInternalIP, Address: "10.0.0.1"}},
				Capacity: corev1.ResourceList{
					corev1.ResourceCPU:    resourceMustParse("4"),
					corev1.ResourceMemory: resourceMustParse("8Gi"),
					corev1.ResourcePods:   resourceMustParse("110"),
				},
			},
		},
		&corev1.Pod{
			ObjectMeta: metav1.ObjectMeta{
				Name:              "api-abc",
				Namespace:         "default",
				CreationTimestamp: metav1.NewTime(time.Now().Add(-10 * time.Minute)),
			},
			Spec: corev1.PodSpec{
				NodeName:   "node-1",
				Containers: []corev1.Container{{Name: "api"}},
			},
			Status: corev1.PodStatus{Phase: corev1.PodRunning},
		},
		&appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{
				Name:              "api",
				Namespace:         "default",
				CreationTimestamp: metav1.NewTime(time.Now().Add(-24 * time.Hour)),
			},
			Spec:   appsv1.DeploymentSpec{Replicas: &replicas},
			Status: appsv1.DeploymentStatus{ReadyReplicas: 2, AvailableReplicas: 2},
		},
		&corev1.Service{
			ObjectMeta: metav1.ObjectMeta{Name: "api", Namespace: "default"},
			Spec: corev1.ServiceSpec{
				Type:      corev1.ServiceTypeClusterIP,
				ClusterIP: "10.96.0.10",
				Ports:     []corev1.ServicePort{{Port: 80, Protocol: corev1.ProtocolTCP}},
			},
		},
	)

	state, err := New(client, nil).Scan(context.Background())
	if err != nil {
		t.Fatalf("Scan returned error: %v", err)
	}

	if state.Summary.TotalNodes != 1 || state.Summary.ReadyNodes != 1 {
		t.Fatalf("unexpected node summary: %+v", state.Summary)
	}
	if state.Summary.TotalPods != 1 || state.Summary.RunningPods != 1 {
		t.Fatalf("unexpected pod summary: %+v", state.Summary)
	}
	if got := state.Nodes[0].PodCount; got != 1 {
		t.Fatalf("expected node pod count 1, got %d", got)
	}
	if got := state.Deployments[0].Replicas; got != 3 {
		t.Fatalf("expected replicas 3, got %d", got)
	}
	if got := state.Services[0].Ports; got != "80/TCP" {
		t.Fatalf("expected service port 80/TCP, got %q", got)
	}
}

func TestScanDefaultsNilDeploymentReplicas(t *testing.T) {
	client := fake.NewSimpleClientset(
		&corev1.Namespace{ObjectMeta: metav1.ObjectMeta{Name: "default"}},
		&appsv1.Deployment{
			ObjectMeta: metav1.ObjectMeta{Name: "api", Namespace: "default"},
			Spec:       appsv1.DeploymentSpec{Replicas: nil},
		},
	)

	state, err := New(client, nil).Scan(context.Background())
	if err != nil {
		t.Fatalf("Scan returned error: %v", err)
	}
	if got := state.Deployments[0].Replicas; got != 1 {
		t.Fatalf("expected default replicas 1, got %d", got)
	}
}

func resourceMustParse(value string) resource.Quantity {
	quantity, err := resource.ParseQuantity(value)
	if err != nil {
		panic(err)
	}
	return quantity
}
