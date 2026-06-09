package cost

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sort"
	"strings"
	"time"
)

// AzureProvider fetches real cost data from Azure Cost Management API.
// Requires: AZURE_SUBSCRIPTION_ID, AZURE_TENANT_ID, AZURE_CLIENT_ID, AZURE_CLIENT_SECRET
type AzureProvider struct {
	subscriptionID string
	tenantID       string
	clientID       string
	clientSecret   string
	accessToken    string
	tokenExpiry    time.Time
}

func NewAzureProvider() *AzureProvider {
	return &AzureProvider{
		subscriptionID: os.Getenv("AZURE_SUBSCRIPTION_ID"),
		tenantID:       os.Getenv("AZURE_TENANT_ID"),
		clientID:       os.Getenv("AZURE_CLIENT_ID"),
		clientSecret:   os.Getenv("AZURE_CLIENT_SECRET"),
	}
}

func (a *AzureProvider) Name() string { return "azure" }

func (a *AzureProvider) IsConfigured() bool {
	return a.subscriptionID != "" && a.tenantID != "" && a.clientID != "" && a.clientSecret != ""
}

func (a *AzureProvider) FetchCosts(ctx context.Context) (*CostSummary, error) {
	if !a.IsConfigured() {
		return nil, fmt.Errorf("Azure credentials not configured")
	}

	// Get access token
	token, err := a.getAccessToken(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get Azure access token: %w", err)
	}

	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)

	// Azure Cost Management - Query Usage
	url := fmt.Sprintf("https://management.azure.com/subscriptions/%s/providers/Microsoft.CostManagement/query?api-version=2023-11-01", a.subscriptionID)

	requestBody := fmt.Sprintf(`{
		"type": "ActualCost",
		"timeframe": "Custom",
		"timePeriod": {
			"from": "%s",
			"to": "%s"
		},
		"dataset": {
			"granularity": "None",
			"aggregation": {
				"totalCost": {"name": "Cost", "function": "Sum"},
				"totalCostUSD": {"name": "CostUSD", "function": "Sum"}
			},
			"grouping": [
				{"type": "Dimension", "name": "ServiceName"}
			]
		}
	}`, startOfMonth.Format("2006-01-02T00:00:00Z"), now.Format("2006-01-02T00:00:00Z"))

	req, err := http.NewRequestWithContext(ctx, "POST", url, strings.NewReader(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create Azure request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Azure Cost Management request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Azure Cost Management returned %d: %s", resp.StatusCode, string(body))
	}

	var result azureCostResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode Azure response: %w", err)
	}

	return a.parseCostResponse(&result)
}

func (a *AzureProvider) getAccessToken(ctx context.Context) (string, error) {
	// Check if cached token is still valid
	if a.accessToken != "" && time.Now().Before(a.tokenExpiry) {
		return a.accessToken, nil
	}

	// OAuth2 client credentials flow
	url := fmt.Sprintf("https://login.microsoftonline.com/%s/oauth2/v2.0/token", a.tenantID)
	body := fmt.Sprintf("client_id=%s&client_secret=%s&scope=https://management.azure.com/.default&grant_type=client_credentials",
		a.clientID, a.clientSecret)

	req, err := http.NewRequestWithContext(ctx, "POST", url, strings.NewReader(body))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("Azure token request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("Azure token request returned %d: %s", resp.StatusCode, string(respBody))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		ExpiresIn   int    `json:"expires_in"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
		return "", err
	}

	a.accessToken = tokenResp.AccessToken
	a.tokenExpiry = time.Now().Add(time.Duration(tokenResp.ExpiresIn-60) * time.Second)
	return a.accessToken, nil
}

func (a *AzureProvider) parseCostResponse(result *azureCostResponse) (*CostSummary, error) {
	var items []CostItem
	totalCost := 0.0

	// Azure returns rows as arrays: [[cost, costUSD, serviceName], ...]
	for _, row := range result.Properties.Rows {
		if len(row) < 3 {
			continue
		}
		amount := 0.0
		if f, ok := row[0].(float64); ok {
			amount = f
		}
		serviceName := ""
		if s, ok := row[2].(string); ok {
			serviceName = s
		}
		if amount < 0.01 || serviceName == "" {
			continue
		}
		totalCost += amount
		items = append(items, CostItem{
			Name:      serviceName,
			Kind:      "Service",
			Namespace: "azure",
			Estimate:  FormatCurrency(amount) + "/mo",
			Basis:     "Azure Cost Management",
			RawCost:   amount,
		})
	}

	sort.Slice(items, func(i, j int) bool { return items[i].RawCost > items[j].RawCost })

	potentialSavings := totalCost * 0.20

	var recommendations []CostRecommendation
	if totalCost > 500 {
		recommendations = append(recommendations, CostRecommendation{
			Title:  "Use Azure Reserved Instances",
			Saving: FormatCurrency(totalCost * 0.30) + "/mo",
			Detail: "Commit to 1-year or 3-year reservations for up to 72% savings on VMs.",
		})
	}
	if totalCost > 200 {
		recommendations = append(recommendations, CostRecommendation{
			Title:  "Use Azure Spot VMs",
			Saving: FormatCurrency(totalCost * 0.15) + "/mo",
			Detail: "Azure Spot VMs offer up to 90% discount for interruptible workloads.",
		})
	}
	if totalCost > 100 {
		recommendations = append(recommendations, CostRecommendation{
			Title:  "Enable Azure Advisor cost recommendations",
			Saving: FormatCurrency(totalCost * 0.10) + "/mo",
			Detail: "Azure Advisor identifies idle and underutilized resources automatically.",
		})
	}

	return &CostSummary{
		MonthlySpend:     FormatCurrency(totalCost),
		PotentialSavings: FormatCurrency(potentialSavings),
		Items:            items,
		Recommendations:  recommendations,
		Source:           "azure",
		LastUpdated:      time.Now().UTC().Format(time.RFC3339),
	}, nil
}

// Azure response types
type azureCostResponse struct {
	Properties azureCostProperties `json:"properties"`
}

type azureCostProperties struct {
	Rows    [][]interface{}    `json:"rows"`
	Columns []azureCostColumn  `json:"columns"`
}

type azureCostColumn struct {
	Name string `json:"name"`
	Type string `json:"type"`
}
