package main

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestIncidentsListsLiveIncidents(t *testing.T) {
	server := testAPIServer(t, nil)
	defer server.Close()

	out, errOut := &bytes.Buffer{}, &bytes.Buffer{}
	cli := testCLI(server.URL, out, errOut)

	if err := cli.Run([]string{"incidents"}); err != nil {
		t.Fatalf("incidents returned error: %v\nstderr: %s", err, errOut.String())
	}
	output := out.String()
	if !strings.Contains(output, "INC-0001") || !strings.Contains(output, "checkout-api CrashLoopBackOff") {
		t.Fatalf("unexpected incidents output:\n%s", output)
	}
}

func TestAnalyzeCallsStructuredAndChatAPIs(t *testing.T) {
	var analyzeCalled bool
	var chatPrompt string
	server := testAPIServer(t, func(w http.ResponseWriter, r *http.Request) bool {
		switch r.URL.Path {
		case "/api/v1/ai/analyze":
			analyzeCalled = true
			writeJSON(t, w, analysisResponse{
				IncidentID: "INC-0001",
				Severity:   "high",
				Summary:    "Pod is crash-looping.",
			})
			return true
		case "/api/v1/ai/chat":
			var body map[string]string
			if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
				t.Fatalf("decode chat body: %v", err)
			}
			chatPrompt = body["message"]
			writeJSON(t, w, chatResponse{Response: "Restart the pod after checking logs.", Model: "test-model", ContextSource: "live"})
			return true
		}
		return false
	})
	defer server.Close()

	out, errOut := &bytes.Buffer{}, &bytes.Buffer{}
	cli := testCLI(server.URL, out, errOut)

	if err := cli.Run([]string{"analyze", "INC-0001"}); err != nil {
		t.Fatalf("analyze returned error: %v\nstderr: %s", err, errOut.String())
	}
	if !analyzeCalled {
		t.Fatal("expected /api/v1/ai/analyze to be called")
	}
	if !strings.Contains(chatPrompt, "INC-0001") || !strings.Contains(chatPrompt, "CrashLoopBackOff") {
		t.Fatalf("chat prompt did not include incident context: %s", chatPrompt)
	}
	if !strings.Contains(out.String(), "Restart the pod") {
		t.Fatalf("unexpected analyze output:\n%s", out.String())
	}
}

func TestRemediateIncidentInfersRestartPod(t *testing.T) {
	var request remediationRequest
	server := testAPIServer(t, func(w http.ResponseWriter, r *http.Request) bool {
		if r.URL.Path != "/api/v1/remediation/execute" {
			return false
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatalf("decode remediation request: %v", err)
		}
		writeJSON(t, w, remediationResult{
			Action:  request.Action,
			Target:  request.Namespace + "/" + request.Target,
			Status:  "dry-run",
			Message: "Would execute restart-pod",
			DryRun:  request.DryRun,
			Reason:  request.Reason,
		})
		return true
	})
	defer server.Close()

	out, errOut := &bytes.Buffer{}, &bytes.Buffer{}
	cli := testCLI(server.URL, out, errOut)

	if err := cli.Run([]string{"remediate", "INC-0001", "--dry-run"}); err != nil {
		t.Fatalf("remediate returned error: %v\nstderr: %s", err, errOut.String())
	}
	if request.Action != "restart-pod" || request.Namespace != "production" || request.Target != "checkout-api-7d8f4" {
		t.Fatalf("unexpected remediation request: %+v", request)
	}
	if !request.DryRun {
		t.Fatal("expected dry-run request")
	}
	if !strings.Contains(out.String(), "[DRY RUN]") {
		t.Fatalf("expected dry-run output, got:\n%s", out.String())
	}
}

func TestRemediateExplicitAction(t *testing.T) {
	var request remediationRequest
	server := testAPIServer(t, func(w http.ResponseWriter, r *http.Request) bool {
		if r.URL.Path != "/api/v1/remediation/execute" {
			return false
		}
		if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
			t.Fatalf("decode remediation request: %v", err)
		}
		writeJSON(t, w, remediationResult{Action: request.Action, Target: request.Namespace + "/" + request.Target, Status: "success", Message: "ok"})
		return true
	})
	defer server.Close()

	out, errOut := &bytes.Buffer{}, &bytes.Buffer{}
	cli := testCLI(server.URL, out, errOut)

	if err := cli.Run([]string{"remediate", "scale-deployment", "production/checkout-api", "--reason", "load spike"}); err != nil {
		t.Fatalf("remediate returned error: %v\nstderr: %s", err, errOut.String())
	}
	if request.Action != "scale-deployment" || request.Namespace != "production" || request.Target != "checkout-api" || request.Reason != "load spike" {
		t.Fatalf("unexpected remediation request: %+v", request)
	}
}

func testCLI(apiURL string, out, errOut *bytes.Buffer) *CLI {
	return &CLI{
		apiURL: apiURL,
		client: serverClient(),
		out:    out,
		errOut: errOut,
	}
}

func serverClient() *http.Client {
	return &http.Client{}
}

func testAPIServer(t *testing.T, override func(http.ResponseWriter, *http.Request) bool) *httptest.Server {
	t.Helper()
	incident := Incident{
		ID:        "INC-0001",
		Title:     "checkout-api CrashLoopBackOff",
		Severity:  "high",
		Status:    "active",
		Service:   "checkout-api",
		Namespace: "production",
		RootCause: "Container api is crash-looping.",
		Evidence: []string{
			"Pod production/checkout-api-7d8f4 container api CrashLoopBackOff",
			"Restart count: 7",
		},
	}
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if override != nil && override(w, r) {
			return
		}
		switch r.URL.Path {
		case "/api/v1/incidents", "/api/v1/incidents/stored":
			writeJSON(t, w, incidentListResponse{Incidents: []Incident{incident}, Total: 1})
		default:
			http.NotFound(w, r)
		}
	}))
}

func writeJSON(t *testing.T, w http.ResponseWriter, value any) {
	t.Helper()
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(value); err != nil {
		t.Fatalf("encode response: %v", err)
	}
}
