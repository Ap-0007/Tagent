package secrets

import (
	"context"
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	corev1 "k8s.io/api/core/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

const (
	SecretNamespace = "tagent-system"
	SecretPrefix    = "tagent-integration-"
)

// SecretStore manages integration credentials in Kubernetes Secrets
type SecretStore struct {
	client    kubernetes.Interface
	namespace string
}

// NewSecretStore creates a new K8s secret store
// Tries in-cluster config first, falls back to kubeconfig
// Auto-creates namespace and required RBAC if they don't exist
func NewSecretStore() (*SecretStore, error) {
	var config *rest.Config
	var err error

	// Try in-cluster first (running inside K8s)
	config, err = rest.InClusterConfig()
	if err != nil {
		// Fall back to kubeconfig (local dev)
		kubeconfig := os.Getenv("KUBECONFIG")
		if kubeconfig == "" {
			home, _ := os.UserHomeDir()
			kubeconfig = filepath.Join(home, ".kube", "config")
		}
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			return nil, fmt.Errorf("cannot create k8s client: %w", err)
		}
	}

	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, fmt.Errorf("cannot create k8s clientset: %w", err)
	}

	ns := os.Getenv("INTEGRATION_SECRET_NAMESPACE")
	if ns == "" {
		ns = SecretNamespace
	}

	store := &SecretStore{client: clientset, namespace: ns}

	// Auto-create namespace if it doesn't exist
	store.ensureNamespace()

	return store, nil
}

// ensureNamespace creates the target namespace if it doesn't exist
func (s *SecretStore) ensureNamespace() {
	ctx := context.Background()
	_, err := s.client.CoreV1().Namespaces().Get(ctx, s.namespace, metav1.GetOptions{})
	if err == nil {
		return // already exists
	}

	// Create namespace
	ns := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: s.namespace,
			Labels: map[string]string{
				"app.kubernetes.io/managed-by": "tagent",
				"tagent.ai/component":          "system",
			},
		},
	}
	_, err = s.client.CoreV1().Namespaces().Create(ctx, ns, metav1.CreateOptions{})
	if err != nil {
		fmt.Printf("WARNING: could not auto-create namespace %s: %v\n", s.namespace, err)
	} else {
		fmt.Printf("Auto-created namespace: %s\n", s.namespace)
	}

	// Auto-create ServiceAccount + RBAC for the notification service
	s.ensureRBAC()
}

// ensureRBAC creates the ServiceAccount, Role, and RoleBinding needed
func (s *SecretStore) ensureRBAC() {
	ctx := context.Background()

	// Create ServiceAccount
	sa := &corev1.ServiceAccount{
		ObjectMeta: metav1.ObjectMeta{
			Name:      "tagent-notification",
			Namespace: s.namespace,
			Labels:    map[string]string{"app.kubernetes.io/managed-by": "tagent"},
		},
	}
	s.client.CoreV1().ServiceAccounts(s.namespace).Create(ctx, sa, metav1.CreateOptions{})

	// Create Role (using raw API since rbacv1 needs import)
	// The Role allows get/list/create/update/delete on secrets in this namespace
	roleData := fmt.Sprintf(`{
		"apiVersion": "rbac.authorization.k8s.io/v1",
		"kind": "Role",
		"metadata": {
			"name": "tagent-secret-manager",
			"namespace": "%s",
			"labels": {"app.kubernetes.io/managed-by": "tagent"}
		},
		"rules": [{
			"apiGroups": [""],
			"resources": ["secrets"],
			"verbs": ["get", "list", "create", "update", "delete"]
		}]
	}`, s.namespace)

	roleBindingData := fmt.Sprintf(`{
		"apiVersion": "rbac.authorization.k8s.io/v1",
		"kind": "RoleBinding",
		"metadata": {
			"name": "tagent-secret-manager-binding",
			"namespace": "%s",
			"labels": {"app.kubernetes.io/managed-by": "tagent"}
		},
		"subjects": [{
			"kind": "ServiceAccount",
			"name": "tagent-notification",
			"namespace": "%s"
		}],
		"roleRef": {
			"kind": "Role",
			"name": "tagent-secret-manager",
			"apiGroup": "rbac.authorization.k8s.io"
		}
	}`, s.namespace, s.namespace)

	// Apply Role via REST API
	applyRaw(s.client, fmt.Sprintf("/apis/rbac.authorization.k8s.io/v1/namespaces/%s/roles", s.namespace), roleData)
	// Apply RoleBinding via REST API
	applyRaw(s.client, fmt.Sprintf("/apis/rbac.authorization.k8s.io/v1/namespaces/%s/rolebindings", s.namespace), roleBindingData)

	fmt.Printf("Auto-created RBAC for tagent-notification in namespace %s\n", s.namespace)
}

// applyRaw sends a raw JSON payload to the K8s API (for RBAC resources)
func applyRaw(client kubernetes.Interface, path string, jsonData string) {
	// Use the REST client to POST raw JSON
	result := client.CoreV1().RESTClient().
		Post().
		AbsPath(path).
		Body([]byte(jsonData)).
		SetHeader("Content-Type", "application/json").
		Do(context.Background())
	if err := result.Error(); err != nil {
		// Ignore "already exists" errors
		if !strings.Contains(err.Error(), "already exists") {
			fmt.Printf("WARNING: RBAC apply failed for %s: %v\n", path, err)
		}
	}
}

// SaveCredentials stores integration credentials as a K8s Secret
func (s *SecretStore) SaveCredentials(integrationID string, credentials map[string]string) error {
	ctx := context.Background()
	secretName := SecretPrefix + integrationID

	// Convert string values to []byte for K8s Secret data
	data := make(map[string][]byte)
	for k, v := range credentials {
		data[k] = []byte(v)
	}

	secret := &corev1.Secret{
		ObjectMeta: metav1.ObjectMeta{
			Name:      secretName,
			Namespace: s.namespace,
			Labels: map[string]string{
				"app.kubernetes.io/managed-by": "tagent",
				"tagent.ai/component":          "integration",
				"tagent.ai/integration-id":     integrationID,
			},
		},
		Type: corev1.SecretTypeOpaque,
		Data: data,
	}

	// Try to get existing secret
	existing, err := s.client.CoreV1().Secrets(s.namespace).Get(ctx, secretName, metav1.GetOptions{})
	if err == nil {
		// Update existing
		existing.Data = data
		_, err = s.client.CoreV1().Secrets(s.namespace).Update(ctx, existing, metav1.UpdateOptions{})
		return err
	}

	// Create new
	_, err = s.client.CoreV1().Secrets(s.namespace).Create(ctx, secret, metav1.CreateOptions{})
	return err
}

// GetCredentials retrieves integration credentials from K8s Secret
func (s *SecretStore) GetCredentials(integrationID string) (map[string]string, error) {
	ctx := context.Background()
	secretName := SecretPrefix + integrationID

	secret, err := s.client.CoreV1().Secrets(s.namespace).Get(ctx, secretName, metav1.GetOptions{})
	if err != nil {
		return nil, err
	}

	result := make(map[string]string)
	for k, v := range secret.Data {
		result[k] = string(v)
	}
	return result, nil
}

// GetMaskedCredentials returns credentials with values masked (for UI display)
func (s *SecretStore) GetMaskedCredentials(integrationID string) (map[string]string, error) {
	creds, err := s.GetCredentials(integrationID)
	if err != nil {
		return nil, err
	}

	masked := make(map[string]string)
	for k, v := range creds {
		masked[k] = maskValue(v)
	}
	return masked, nil
}

// DeleteCredentials removes an integration's K8s Secret
func (s *SecretStore) DeleteCredentials(integrationID string) error {
	ctx := context.Background()
	secretName := SecretPrefix + integrationID
	return s.client.CoreV1().Secrets(s.namespace).Delete(ctx, secretName, metav1.DeleteOptions{})
}

// HasCredentials checks if credentials exist for an integration
func (s *SecretStore) HasCredentials(integrationID string) bool {
	ctx := context.Background()
	secretName := SecretPrefix + integrationID
	_, err := s.client.CoreV1().Secrets(s.namespace).Get(ctx, secretName, metav1.GetOptions{})
	return err == nil
}

// ListConfiguredIntegrations returns IDs of all integrations that have saved credentials
func (s *SecretStore) ListConfiguredIntegrations() ([]string, error) {
	ctx := context.Background()
	secrets, err := s.client.CoreV1().Secrets(s.namespace).List(ctx, metav1.ListOptions{
		LabelSelector: "tagent.ai/component=integration",
	})
	if err != nil {
		return nil, err
	}

	var ids []string
	for _, secret := range secrets.Items {
		id := strings.TrimPrefix(secret.Name, SecretPrefix)
		ids = append(ids, id)
	}
	return ids, nil
}

// maskValue masks a credential value for safe display
func maskValue(value string) string {
	if len(value) <= 8 {
		return "••••••••"
	}
	// Show first 4 and last 4 characters
	decoded, err := base64.StdEncoding.DecodeString(value)
	if err == nil {
		value = string(decoded)
	}
	return value[:4] + "••••••••" + value[len(value)-4:]
}
