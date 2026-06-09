package loki

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"
)

// Client queries Grafana Loki for log aggregation.
type Client struct {
	endpoint string
	client   *http.Client
}

// LogEntry represents a single log line from Loki.
type LogEntry struct {
	Timestamp string `json:"timestamp"`
	Line      string `json:"line"`
	Labels    map[string]string `json:"labels"`
}

// SearchResult is the response from a log search.
type SearchResult struct {
	Entries []LogEntry `json:"entries"`
	Total   int        `json:"total"`
	Query   string     `json:"query"`
	Source  string     `json:"source"` // "loki" or "kubernetes"
}

// New creates a Loki client.
func New() *Client {
	endpoint := os.Getenv("LOKI_URL")
	if endpoint == "" {
		endpoint = "http://localhost:3100"
	}
	return &Client{
		endpoint: endpoint,
		client:   &http.Client{Timeout: 30 * time.Second},
	}
}

// IsConfigured checks if Loki is reachable.
func (c *Client) IsConfigured() bool {
	resp, err := c.client.Get(c.endpoint + "/ready")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200
}

// Search queries Loki using LogQL.
func (c *Client) Search(ctx context.Context, query string, namespace string, start, end time.Time, limit int) (*SearchResult, error) {
	// Build LogQL query
	logql := query
	if namespace != "" && query == "" {
		logql = fmt.Sprintf(`{namespace="%s"}`, namespace)
	} else if namespace != "" {
		logql = fmt.Sprintf(`{namespace="%s"} |~ "%s"`, namespace, query)
	} else if query != "" {
		logql = fmt.Sprintf(`{} |~ "%s"`, query)
	}

	if limit <= 0 {
		limit = 100
	}

	params := url.Values{
		"query":     {logql},
		"start":     {fmt.Sprintf("%d", start.UnixNano())},
		"end":       {fmt.Sprintf("%d", end.UnixNano())},
		"limit":     {fmt.Sprintf("%d", limit)},
		"direction": {"backward"},
	}

	reqURL := fmt.Sprintf("%s/loki/api/v1/query_range?%s", c.endpoint, params.Encode())
	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create Loki request: %w", err)
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Loki request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Loki returned %d: %s", resp.StatusCode, string(body))
	}

	var lokiResp lokiQueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&lokiResp); err != nil {
		return nil, fmt.Errorf("failed to decode Loki response: %w", err)
	}

	return parseLokiResponse(&lokiResp, logql)
}

// SearchLabels returns available label names for filtering.
func (c *Client) SearchLabels(ctx context.Context) ([]string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", c.endpoint+"/loki/api/v1/labels", nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result struct {
		Data []string `json:"data"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	return result.Data, nil
}

func parseLokiResponse(resp *lokiQueryResponse, query string) (*SearchResult, error) {
	var entries []LogEntry

	for _, stream := range resp.Data.Result {
		labels := stream.Stream
		for _, val := range stream.Values {
			if len(val) >= 2 {
				entries = append(entries, LogEntry{
					Timestamp: val[0],
					Line:      val[1],
					Labels:    labels,
				})
			}
		}
	}

	return &SearchResult{
		Entries: entries,
		Total:   len(entries),
		Query:   query,
		Source:  "loki",
	}, nil
}

// Loki API response types
type lokiQueryResponse struct {
	Status string `json:"status"`
	Data   struct {
		ResultType string       `json:"resultType"`
		Result     []lokiStream `json:"result"`
	} `json:"data"`
}

type lokiStream struct {
	Stream map[string]string `json:"stream"`
	Values [][]string        `json:"values"`
}
