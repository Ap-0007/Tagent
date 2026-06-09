package tracing

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

// Client queries Jaeger for distributed traces.
type Client struct {
	endpoint string
	client   *http.Client
}

// Span represents a single span in a trace.
type Span struct {
	TraceID       string            `json:"traceID"`
	SpanID        string            `json:"spanID"`
	OperationName string            `json:"operationName"`
	ServiceName   string            `json:"serviceName"`
	Duration      int64             `json:"duration"` // microseconds
	StartTime     int64             `json:"startTime"`
	Tags          map[string]string `json:"tags"`
	StatusCode    int               `json:"statusCode,omitempty"`
}

// Trace represents a full distributed trace.
type Trace struct {
	TraceID   string `json:"traceID"`
	Spans     []Span `json:"spans"`
	Services  []string `json:"services"`
	Duration  int64  `json:"duration"` // total duration in microseconds
	StartTime int64  `json:"startTime"`
	SpanCount int    `json:"spanCount"`
}

// TraceSearchResult is the response from searching traces.
type TraceSearchResult struct {
	Traces []Trace `json:"traces"`
	Total  int     `json:"total"`
	Source string  `json:"source"` // "jaeger" or "unavailable"
}

// New creates a Jaeger query client.
func New() *Client {
	endpoint := os.Getenv("JAEGER_QUERY_URL")
	if endpoint == "" {
		endpoint = "http://localhost:16686"
	}
	return &Client{
		endpoint: endpoint,
		client:   &http.Client{Timeout: 15 * time.Second},
	}
}

// IsConfigured checks if Jaeger is reachable.
func (c *Client) IsConfigured() bool {
	resp, err := c.client.Get(c.endpoint + "/api/services")
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == 200
}

// GetServices returns all services reporting traces.
func (c *Client) GetServices(ctx context.Context) ([]string, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", c.endpoint+"/api/services", nil)
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

// SearchTraces finds traces matching criteria.
func (c *Client) SearchTraces(ctx context.Context, service string, operation string, minDuration string, limit int, start, end time.Time) (*TraceSearchResult, error) {
	params := url.Values{
		"limit":   {fmt.Sprintf("%d", limit)},
		"start":   {fmt.Sprintf("%d", start.UnixMicro())},
		"end":     {fmt.Sprintf("%d", end.UnixMicro())},
	}
	if service != "" {
		params.Set("service", service)
	}
	if operation != "" {
		params.Set("operation", operation)
	}
	if minDuration != "" {
		params.Set("minDuration", minDuration)
	}

	reqURL := fmt.Sprintf("%s/api/traces?%s", c.endpoint, params.Encode())
	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("Jaeger request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Jaeger returned %d: %s", resp.StatusCode, string(body))
	}

	var jaegerResp jaegerTracesResponse
	if err := json.NewDecoder(resp.Body).Decode(&jaegerResp); err != nil {
		return nil, err
	}

	return parseJaegerResponse(&jaegerResp)
}

// GetTrace fetches a single trace by ID.
func (c *Client) GetTrace(ctx context.Context, traceID string) (*Trace, error) {
	reqURL := fmt.Sprintf("%s/api/traces/%s", c.endpoint, traceID)
	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err != nil {
		return nil, err
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return nil, fmt.Errorf("trace %s not found", traceID)
	}

	var jaegerResp jaegerTracesResponse
	if err := json.NewDecoder(resp.Body).Decode(&jaegerResp); err != nil {
		return nil, err
	}

	result, err := parseJaegerResponse(&jaegerResp)
	if err != nil || len(result.Traces) == 0 {
		return nil, fmt.Errorf("trace %s not found", traceID)
	}
	return &result.Traces[0], nil
}

func parseJaegerResponse(resp *jaegerTracesResponse) (*TraceSearchResult, error) {
	var traces []Trace

	for _, jTrace := range resp.Data {
		// Build process map (processID → serviceName)
		processMap := make(map[string]string)
		for pid, proc := range jTrace.Processes {
			processMap[pid] = proc.ServiceName
		}

		var spans []Span
		var services []string
		serviceSet := make(map[string]bool)
		var minStart, maxEnd int64

		for _, jSpan := range jTrace.Spans {
			svcName := processMap[jSpan.ProcessID]
			if !serviceSet[svcName] {
				serviceSet[svcName] = true
				services = append(services, svcName)
			}

			tags := make(map[string]string)
			for _, tag := range jSpan.Tags {
				tags[tag.Key] = fmt.Sprintf("%v", tag.Value)
			}

			spans = append(spans, Span{
				TraceID:       jSpan.TraceID,
				SpanID:        jSpan.SpanID,
				OperationName: jSpan.OperationName,
				ServiceName:   svcName,
				Duration:      jSpan.Duration,
				StartTime:     jSpan.StartTime,
				Tags:          tags,
			})

			if minStart == 0 || jSpan.StartTime < minStart {
				minStart = jSpan.StartTime
			}
			end := jSpan.StartTime + jSpan.Duration
			if end > maxEnd {
				maxEnd = end
			}
		}

		traces = append(traces, Trace{
			TraceID:   jTrace.TraceID,
			Spans:     spans,
			Services:  services,
			Duration:  maxEnd - minStart,
			StartTime: minStart,
			SpanCount: len(spans),
		})
	}

	return &TraceSearchResult{
		Traces: traces,
		Total:  len(traces),
		Source: "jaeger",
	}, nil
}

// Jaeger API response types
type jaegerTracesResponse struct {
	Data []jaegerTrace `json:"data"`
}

type jaegerTrace struct {
	TraceID   string                    `json:"traceID"`
	Spans     []jaegerSpan              `json:"spans"`
	Processes map[string]jaegerProcess  `json:"processes"`
}

type jaegerSpan struct {
	TraceID       string      `json:"traceID"`
	SpanID        string      `json:"spanID"`
	OperationName string      `json:"operationName"`
	ProcessID     string      `json:"processID"`
	Duration      int64       `json:"duration"`
	StartTime     int64       `json:"startTime"`
	Tags          []jaegerTag `json:"tags"`
}

type jaegerTag struct {
	Key   string      `json:"key"`
	Type  string      `json:"type"`
	Value interface{} `json:"value"`
}

type jaegerProcess struct {
	ServiceName string `json:"serviceName"`
}
