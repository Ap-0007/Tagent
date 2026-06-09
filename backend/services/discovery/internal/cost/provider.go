package cost

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"
)

// CostItem represents a single cost line item from a cloud billing API.
type CostItem struct {
	Name      string  `json:"name"`
	Kind      string  `json:"kind"`      // "Node", "Service", "Storage", "Network"
	Namespace string  `json:"namespace"` // "cluster" for nodes, namespace for pods
	Estimate  string  `json:"estimate"`  // "$123.45/mo"
	Basis     string  `json:"basis"`     // "4 vCPU + 16 GB RAM" or "gp3 100GB"
	RawCost   float64 `json:"-"`         // raw monthly cost for calculations
}

// CostRecommendation is a savings suggestion.
type CostRecommendation struct {
	Title  string `json:"title"`
	Saving string `json:"saving"`
	Detail string `json:"detail"`
}

// CostSummary is the overall cost response.
type CostSummary struct {
	MonthlySpend     string               `json:"monthly_spend"`
	PotentialSavings string               `json:"potential_savings"`
	Items            []CostItem           `json:"items"`
	Recommendations  []CostRecommendation `json:"recommendations"`
	Source           string               `json:"source"` // "aws", "gcp", "azure", "estimated"
	LastUpdated      string               `json:"last_updated"`
}

// Provider defines the interface for cloud cost data.
type Provider interface {
	// Name returns the provider identifier ("aws", "gcp", "azure", "estimated")
	Name() string
	// FetchCosts returns the cost breakdown for the current billing period.
	FetchCosts(ctx context.Context) (*CostSummary, error)
	// IsConfigured returns true if the provider has valid credentials.
	IsConfigured() bool
}

// DetectProvider checks environment variables and returns the appropriate provider.
// Priority: AWS > GCP > Azure > Fallback (node-capacity estimation)
func DetectProvider() Provider {
	// Check AWS
	if os.Getenv("AWS_ACCESS_KEY_ID") != "" || os.Getenv("AWS_ROLE_ARN") != "" || os.Getenv("COST_PROVIDER") == "aws" {
		log.Printf("[cost] Detected AWS Cost Explorer provider")
		return NewAWSProvider()
	}

	// Check GCP
	if os.Getenv("GOOGLE_APPLICATION_CREDENTIALS") != "" || os.Getenv("GCP_PROJECT_ID") != "" || os.Getenv("COST_PROVIDER") == "gcp" {
		log.Printf("[cost] Detected GCP Cloud Billing provider")
		return NewGCPProvider()
	}

	// Check Azure
	if os.Getenv("AZURE_SUBSCRIPTION_ID") != "" || os.Getenv("AZURE_TENANT_ID") != "" || os.Getenv("COST_PROVIDER") == "azure" {
		log.Printf("[cost] Detected Azure Cost Management provider")
		return NewAzureProvider()
	}

	log.Printf("[cost] No cloud billing API configured — using node-capacity estimation")
	return nil // nil means use the existing estimation logic
}

// FormatCurrency formats a float as "$1,234.56"
func FormatCurrency(amount float64) string {
	if amount >= 1000 {
		return fmt.Sprintf("$%.0f", amount)
	}
	return fmt.Sprintf("$%.2f", amount)
}

// CurrentMonth returns the billing period string.
func CurrentMonth() string {
	now := time.Now()
	return now.Format("2006-01")
}
