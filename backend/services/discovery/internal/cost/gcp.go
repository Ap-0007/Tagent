package cost

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"time"
)

// GCPProvider fetches real cost data from Google Cloud Billing API.
// Requires: GOOGLE_APPLICATION_CREDENTIALS (service account JSON) or GCP_PROJECT_ID + GCP_BILLING_ACCOUNT
type GCPProvider struct {
	projectID      string
	billingAccount string
	accessToken    string
}

func NewGCPProvider() *GCPProvider {
	return &GCPProvider{
		projectID:      os.Getenv("GCP_PROJECT_ID"),
		billingAccount: os.Getenv("GCP_BILLING_ACCOUNT"),
	}
}

func (g *GCPProvider) Name() string { return "gcp" }

func (g *GCPProvider) IsConfigured() bool {
	return g.projectID != "" || os.Getenv("GOOGLE_APPLICATION_CREDENTIALS") != ""
}

func (g *GCPProvider) FetchCosts(ctx context.Context) (*CostSummary, error) {
	if !g.IsConfigured() {
		return nil, fmt.Errorf("GCP credentials not configured")
	}

	// Get access token from metadata server (GKE) or service account
	token, err := g.getAccessToken(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get GCP access token: %w", err)
	}

	// Query BigQuery billing export or Cloud Billing API
	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	// Use Cloud Billing Budgets API to get cost data
	url := fmt.Sprintf("https://cloudbilling.googleapis.com/v1/billingAccounts/%s/costs:query", g.billingAccount)
	if g.billingAccount == "" {
		// Fallback: Use Resource Manager to get project billing info
		url = fmt.Sprintf("https://cloudresourcemanager.googleapis.com/v1/projects/%s", g.projectID)
	}

	req, err := http.NewRequestWithContext(ctx, "GET", url, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create GCP request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("GCP Billing API request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GCP Billing API returned %d: %s", resp.StatusCode, string(body))
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode GCP response: %w", err)
	}

	// Parse the response based on the API used
	return g.buildCostSummary(result, startOfMonth)
}

func (g *GCPProvider) getAccessToken(ctx context.Context) (string, error) {
	// Try GKE metadata server first
	req, _ := http.NewRequestWithContext(ctx, "GET",
		"http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token", nil)
	req.Header.Set("Metadata-Flavor", "Google")

	resp, err := http.DefaultClient.Do(req)
	if err == nil && resp.StatusCode == 200 {
		defer resp.Body.Close()
		var tokenResp struct {
			AccessToken string `json:"access_token"`
		}
		json.NewDecoder(resp.Body).Decode(&tokenResp)
		if tokenResp.AccessToken != "" {
			return tokenResp.AccessToken, nil
		}
	}

	// Fallback: use gcloud CLI token (for local dev)
	// In production, the metadata server or Workload Identity should provide tokens
	return "", fmt.Errorf("cannot obtain GCP access token — ensure Workload Identity or service account is configured")
}

func (g *GCPProvider) buildCostSummary(result map[string]interface{}, startOfMonth time.Time) (*CostSummary, error) {
	// GCP billing data structure varies by API endpoint
	// This handles the common case of project-level billing
	var items []CostItem
	totalCost := 0.0

	// Parse cost breakdown from response
	if costs, ok := result["costs"].([]interface{}); ok {
		for _, c := range costs {
			if costMap, ok := c.(map[string]interface{}); ok {
				service := fmt.Sprintf("%v", costMap["service"])
				amount := 0.0
				if amt, ok := costMap["amount"].(float64); ok {
					amount = amt
				}
				if amount < 0.01 {
					continue
				}
				totalCost += amount
				items = append(items, CostItem{
					Name:      service,
					Kind:      "Service",
					Namespace: "gcp",
					Estimate:  FormatCurrency(amount) + "/mo",
					Basis:     "GCP Cloud Billing",
					RawCost:   amount,
				})
			}
		}
	}

	// If no detailed breakdown, try to get total from project info
	if len(items) == 0 && totalCost == 0 {
		// Return a basic summary indicating GCP is configured but no detailed data
		return &CostSummary{
			MonthlySpend:     "—",
			PotentialSavings: "—",
			Items:            []CostItem{},
			Recommendations:  []CostRecommendation{{Title: "Enable BigQuery billing export", Saving: "—", Detail: "Export billing data to BigQuery for detailed cost analysis."}},
			Source:           "gcp",
			LastUpdated:      time.Now().UTC().Format(time.RFC3339),
		}, nil
	}

	sort.Slice(items, func(i, j int) bool { return items[i].RawCost > items[j].RawCost })

	potentialSavings := totalCost * 0.20

	var recommendations []CostRecommendation
	if totalCost > 500 {
		recommendations = append(recommendations, CostRecommendation{
			Title:  "Use Committed Use Discounts",
			Saving: FormatCurrency(totalCost * 0.25) + "/mo",
			Detail: "Commit to 1-year or 3-year usage for up to 57% discount on Compute Engine.",
		})
	}
	if totalCost > 200 {
		recommendations = append(recommendations, CostRecommendation{
			Title:  "Use Preemptible VMs for batch workloads",
			Saving: FormatCurrency(totalCost * 0.15) + "/mo",
			Detail: "Preemptible VMs offer up to 80% discount for fault-tolerant workloads.",
		})
	}

	return &CostSummary{
		MonthlySpend:     FormatCurrency(totalCost),
		PotentialSavings: FormatCurrency(potentialSavings),
		Items:            items,
		Recommendations:  recommendations,
		Source:           "gcp",
		LastUpdated:      time.Now().UTC().Format(time.RFC3339),
	}, nil
}
