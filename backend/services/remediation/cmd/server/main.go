package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

type ActionRequest struct {
	Action    string `json:"action" binding:"required"`
	Namespace string `json:"namespace" binding:"required"`
	Target    string `json:"target" binding:"required"`
	DryRun    bool   `json:"dry_run"`
}

type ActionResult struct {
	Action    string `json:"action"`
	Target    string `json:"target"`
	Status    string `json:"status"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	DryRun    bool   `json:"dry_run"`
}

var (
	client *kubernetes.Clientset
	mode   string
)

func main() {
	port := envOr("PORT", "8084")
	mode = envOr("REMEDIATION_MODE", "read-only")

	// Init K8s client
	config, err := rest.InClusterConfig()
	if err != nil {
		kubeconfig := envOr("KUBECONFIG", "")
		if kubeconfig == "" {
			home, _ := os.UserHomeDir()
			kubeconfig = home + "/.kube/config"
		}
		config, err = clientcmd.BuildConfigFromFlags("", kubeconfig)
		if err != nil {
			log.Fatalf("Cannot create K8s client: %v", err)
		}
	}
	client, err = kubernetes.NewForConfig(config)
	if err != nil {
		log.Fatalf("Cannot create K8s client: %v", err)
	}

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "healthy", "service": "tagent-remediation", "mode": mode})
	})

	router.POST("/execute", executeAction)
	router.GET("/history", func(c *gin.Context) {
		c.JSON(200, gin.H{"history": []ActionResult{}, "total": 0})
	})

	log.Printf("Tagent Remediation Service starting on port %s (mode: %s)", port, mode)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start: %v", err)
	}
}

func executeAction(c *gin.Context) {
	var req ActionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Safety check: read-only mode blocks all actions
	if mode == "read-only" && !req.DryRun {
		c.JSON(http.StatusForbidden, gin.H{
			"error":   "Remediation is in read-only mode",
			"message": "Set REMEDIATION_MODE=approval-required or auto to enable actions",
		})
		return
	}

	result := ActionResult{
		Action:    req.Action,
		Target:    req.Namespace + "/" + req.Target,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		DryRun:    req.DryRun,
	}

	if req.DryRun {
		result.Status = "dry-run"
		result.Message = "Would execute: " + req.Action + " on " + req.Target
		c.JSON(200, result)
		return
	}

	ctx := context.Background()

	switch req.Action {
	case "restart-pod":
		err := client.CoreV1().Pods(req.Namespace).Delete(ctx, req.Target, metav1.DeleteOptions{})
		if err != nil {
			result.Status = "failed"
			result.Message = err.Error()
		} else {
			result.Status = "success"
			result.Message = "Pod deleted (will be recreated by controller)"
		}

	case "scale-deployment":
		dep, err := client.AppsV1().Deployments(req.Namespace).Get(ctx, req.Target, metav1.GetOptions{})
		if err != nil {
			result.Status = "failed"
			result.Message = err.Error()
		} else {
			replicas := *dep.Spec.Replicas + 1
			dep.Spec.Replicas = &replicas
			_, err = client.AppsV1().Deployments(req.Namespace).Update(ctx, dep, metav1.UpdateOptions{})
			if err != nil {
				result.Status = "failed"
				result.Message = err.Error()
			} else {
				result.Status = "success"
				result.Message = "Scaled to " + string(rune(replicas+'0')) + " replicas"
			}
		}

	case "rollback-deployment":
		// Rollback = scale down to 0 then back up (simplified)
		result.Status = "not-implemented"
		result.Message = "Rollback requires deployment revision history — coming soon"

	default:
		result.Status = "unknown-action"
		result.Message = "Supported actions: restart-pod, scale-deployment, rollback-deployment"
	}

	log.Printf("AUDIT: action=%s target=%s status=%s dry_run=%v", req.Action, result.Target, result.Status, req.DryRun)
	c.JSON(200, result)
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
