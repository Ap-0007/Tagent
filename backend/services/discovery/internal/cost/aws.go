package cost

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sort"
	"time"

	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strings"
)

// AWSProvider fetches real cost data from AWS Cost Explorer API.
// Requires: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION (or IAM role)
type AWSProvider struct {
	accessKey string
	secretKey string
	region    string
	endpoint  string
}

func NewAWSProvider() *AWSProvider {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}
	return &AWSProvider{
		accessKey: os.Getenv("AWS_ACCESS_KEY_ID"),
		secretKey: os.Getenv("AWS_SECRET_ACCESS_KEY"),
		region:    region,
		endpoint:  fmt.Sprintf("https://ce.%s.amazonaws.com", region),
	}
}

func (a *AWSProvider) Name() string { return "aws" }

func (a *AWSProvider) IsConfigured() bool {
	return a.accessKey != "" && a.secretKey != ""
}

func (a *AWSProvider) FetchCosts(ctx context.Context) (*CostSummary, error) {
	if !a.IsConfigured() {
		return nil, fmt.Errorf("AWS credentials not configured")
	}

	now := time.Now()
	startOfMonth := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	endDate := now.Format("2006-01-02")
	startDate := startOfMonth.Format("2006-01-02")

	// AWS Cost Explorer GetCostAndUsage request
	requestBody := fmt.Sprintf(`{
		"TimePeriod": {"Start": "%s", "End": "%s"},
		"Granularity": "MONTHLY",
		"Metrics": ["BlendedCost", "UnblendedCost", "UsageQuantity"],
		"GroupBy": [{"Type": "DIMENSION", "Key": "SERVICE"}]
	}`, startDate, endDate)

	req, err := http.NewRequestWithContext(ctx, "POST", a.endpoint, strings.NewReader(requestBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Sign the request with AWS Signature V4
	a.signRequest(req, []byte(requestBody))

	req.Header.Set("Content-Type", "application/x-amz-json-1.1")
	req.Header.Set("X-Amz-Target", "AWSInsightsIndexService.GetCostAndUsage")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("AWS Cost Explorer request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("AWS Cost Explorer returned %d: %s", resp.StatusCode, string(body))
	}

	var result awsCostResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode AWS response: %w", err)
	}

	return a.parseCostResponse(&result)
}

// signRequest adds AWS Signature V4 headers.
func (a *AWSProvider) signRequest(req *http.Request, payload []byte) {
	now := time.Now().UTC()
	datestamp := now.Format("20060102")
	amzDate := now.Format("20060102T150405Z")

	req.Header.Set("X-Amz-Date", amzDate)
	req.Header.Set("Host", req.URL.Host)

	// Create canonical request
	payloadHash := sha256Hash(payload)
	canonicalHeaders := fmt.Sprintf("content-type:%s\nhost:%s\nx-amz-date:%s\nx-amz-target:%s\n",
		req.Header.Get("Content-Type"), req.URL.Host, amzDate, req.Header.Get("X-Amz-Target"))
	signedHeaders := "content-type;host;x-amz-date;x-amz-target"

	canonicalRequest := fmt.Sprintf("%s\n%s\n%s\n%s\n%s\n%s",
		req.Method, req.URL.Path, req.URL.RawQuery, canonicalHeaders, signedHeaders, payloadHash)

	// Create string to sign
	credentialScope := fmt.Sprintf("%s/%s/ce/aws4_request", datestamp, a.region)
	stringToSign := fmt.Sprintf("AWS4-HMAC-SHA256\n%s\n%s\n%s",
		amzDate, credentialScope, sha256Hash([]byte(canonicalRequest)))

	// Calculate signature
	signingKey := getSignatureKey(a.secretKey, datestamp, a.region, "ce")
	signature := hex.EncodeToString(hmacSHA256(signingKey, []byte(stringToSign)))

	// Add authorization header
	authHeader := fmt.Sprintf("AWS4-HMAC-SHA256 Credential=%s/%s, SignedHeaders=%s, Signature=%s",
		a.accessKey, credentialScope, signedHeaders, signature)
	req.Header.Set("Authorization", authHeader)
}

func (a *AWSProvider) parseCostResponse(result *awsCostResponse) (*CostSummary, error) {
	var items []CostItem
	totalCost := 0.0
	potentialSavings := 0.0

	for _, period := range result.ResultsByTime {
		for _, group := range period.Groups {
			serviceName := ""
			if len(group.Keys) > 0 {
				serviceName = group.Keys[0]
			}
			amount := 0.0
			if blended, ok := group.Metrics["BlendedCost"]; ok {
				fmt.Sscanf(blended.Amount, "%f", &amount)
			}
			if amount < 0.01 {
				continue
			}
			totalCost += amount
			items = append(items, CostItem{
				Name:      serviceName,
				Kind:      "Service",
				Namespace: "aws",
				Estimate:  FormatCurrency(amount) + "/mo",
				Basis:     "AWS Cost Explorer",
				RawCost:   amount,
			})
		}
	}

	// Sort by cost descending
	sort.Slice(items, func(i, j int) bool { return items[i].RawCost > items[j].RawCost })

	// Calculate potential savings (top services often have optimization opportunities)
	if totalCost > 0 {
		potentialSavings = totalCost * 0.20 // Conservative 20% savings estimate
	}

	var recommendations []CostRecommendation
	if totalCost > 500 {
		recommendations = append(recommendations, CostRecommendation{
			Title:  "Use Reserved Instances",
			Saving: FormatCurrency(totalCost * 0.30) + "/mo",
			Detail: "Convert on-demand EC2 instances to 1-year Reserved Instances for up to 30% savings.",
		})
	}
	if totalCost > 200 {
		recommendations = append(recommendations, CostRecommendation{
			Title:  "Enable Spot Instances for non-critical workloads",
			Saving: FormatCurrency(totalCost * 0.15) + "/mo",
			Detail: "Use EC2 Spot Instances for batch processing and dev/test environments.",
		})
	}
	if len(items) > 5 {
		recommendations = append(recommendations, CostRecommendation{
			Title:  "Consolidate underutilized services",
			Saving: FormatCurrency(totalCost * 0.10) + "/mo",
			Detail: fmt.Sprintf("Review %d AWS services for consolidation opportunities.", len(items)),
		})
	}

	return &CostSummary{
		MonthlySpend:     FormatCurrency(totalCost),
		PotentialSavings: FormatCurrency(potentialSavings),
		Items:            items,
		Recommendations:  recommendations,
		Source:           "aws",
		LastUpdated:      time.Now().UTC().Format(time.RFC3339),
	}, nil
}

// AWS response types
type awsCostResponse struct {
	ResultsByTime []awsResultByTime `json:"ResultsByTime"`
}

type awsResultByTime struct {
	Groups []awsGroup `json:"Groups"`
}

type awsGroup struct {
	Keys    []string             `json:"Keys"`
	Metrics map[string]awsMetric `json:"Metrics"`
}

type awsMetric struct {
	Amount string `json:"Amount"`
	Unit   string `json:"Unit"`
}

// AWS Signature V4 helpers
func sha256Hash(data []byte) string {
	h := sha256.Sum256(data)
	return hex.EncodeToString(h[:])
}

func hmacSHA256(key, data []byte) []byte {
	h := hmac.New(sha256.New, key)
	h.Write(data)
	return h.Sum(nil)
}

func getSignatureKey(secret, datestamp, region, service string) []byte {
	kDate := hmacSHA256([]byte("AWS4"+secret), []byte(datestamp))
	kRegion := hmacSHA256(kDate, []byte(region))
	kService := hmacSHA256(kRegion, []byte(service))
	return hmacSHA256(kService, []byte("aws4_request"))
}

// Ensure unused imports don't cause issues
var _ = log.Printf
var _ = os.Getenv
