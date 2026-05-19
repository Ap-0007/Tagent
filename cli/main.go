package main

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"text/tabwriter"
	"time"
)

const version = "0.3.0"

var apiURL string

func init() {
	apiURL = envOr("TAGENT_API_URL", "http://localhost:8080")
}

type CLI struct {
	apiURL string
	client *http.Client
	out    io.Writer
	errOut io.Writer
}

type Incident struct {
	ID         string   `json:"id"`
	Title      string   `json:"title"`
	Severity   string   `json:"severity"`
	Status     string   `json:"status"`
	Service    string   `json:"service"`
	Namespace  string   `json:"namespace"`
	Node       string   `json:"node"`
	RootCause  string   `json:"root_cause"`
	Evidence   []string `json:"evidence"`
	DetectedAt string   `json:"detected_at"`
	StartedAt  string   `json:"startedAt"`
}

type incidentListResponse struct {
	Incidents []Incident `json:"incidents"`
	Total     int        `json:"total"`
}

type chatResponse struct {
	Response      string `json:"response"`
	Model         string `json:"model"`
	ContextSource string `json:"context_source"`
}

type analysisResponse struct {
	IncidentID       string                 `json:"incident_id"`
	Severity         string                 `json:"severity"`
	Summary          string                 `json:"summary"`
	CorrelatedEvents []any                  `json:"correlated_events"`
	BlastRadius      map[string]interface{} `json:"blast_radius"`
}

type remediationRequest struct {
	Action    string `json:"action"`
	Namespace string `json:"namespace"`
	Target    string `json:"target"`
	DryRun    bool   `json:"dry_run"`
	Reason    string `json:"reason,omitempty"`
}

type remediationResult struct {
	Action    string `json:"action"`
	Target    string `json:"target"`
	Status    string `json:"status"`
	Message   string `json:"message"`
	Timestamp string `json:"timestamp"`
	DryRun    bool   `json:"dry_run"`
	Reason    string `json:"reason,omitempty"`
}

func main() {
	cli := &CLI{
		apiURL: strings.TrimRight(apiURL, "/"),
		client: &http.Client{Timeout: 30 * time.Second},
		out:    os.Stdout,
		errOut: os.Stderr,
	}
	if err := cli.Run(os.Args[1:]); err != nil {
		fmt.Fprintln(cli.errOut, "Error:", err)
		os.Exit(1)
	}
}

func (c *CLI) Run(args []string) error {
	if len(args) == 0 {
		c.printUsage()
		return nil
	}

	switch args[0] {
	case "status":
		return c.cmdStatus()
	case "incidents":
		return c.cmdIncidents(args[1:])
	case "analyze":
		return c.cmdAnalyze(args[1:])
	case "remediate":
		return c.cmdRemediate(args[1:])
	case "pods":
		return c.cmdPods()
	case "nodes":
		return c.cmdNodes()
	case "chat":
		if len(args) == 1 {
			return errors.New("usage: tagent chat '<question>'")
		}
		return c.cmdChat(strings.Join(args[1:], " "))
	case "guardian":
		return c.cmdGuardian(args[1:])
	case "health":
		return c.cmdHealth()
	case "help", "--help", "-h":
		c.printUsage()
		return nil
	case "version", "--version", "-v":
		fmt.Fprintf(c.out, "tagent v%s\n", version)
		return nil
	default:
		c.printUsage()
		return fmt.Errorf("unknown command %q", args[0])
	}
}

func (c *CLI) printUsage() {
	fmt.Fprintf(c.out, `tagent - AI-powered Kubernetes SRE CLI

Usage:
  tagent <command> [args]

Core commands:
  tagent incidents [incident-id] [--stored]
      List active incidents, or show one incident in detail.

  tagent analyze <incident-id>
      Run API analysis and ask the AI engine for root cause guidance.

  tagent remediate <incident-id> [--dry-run]
      Infer the safest remediation for an incident and execute it.

  tagent remediate <action> <namespace/name> [--dry-run] [--reason text]
      Execute an explicit remediation action.

Other commands:
  status, pods, nodes, chat, guardian, health, version

Environment:
  TAGENT_API_URL  API Gateway URL (default: http://localhost:8080)

Examples:
  tagent incidents
  tagent incidents INC-0001
  tagent analyze INC-0001
  tagent remediate INC-0001 --dry-run
  tagent remediate restart-pod production/checkout-api-7d8f4 --dry-run
`)
}

func (c *CLI) cmdIncidents(args []string) error {
	stored, positional, err := parseIncidentsArgs(args)
	if err != nil {
		return err
	}

	incidents, err := c.fetchIncidents(stored)
	if err != nil {
		return err
	}

	if len(positional) > 0 {
		incident, ok := findIncident(incidents, positional[0])
		if !ok {
			return fmt.Errorf("incident %s not found", positional[0])
		}
		c.printIncidentDetail(incident)
		return nil
	}

	if len(incidents) == 0 {
		fmt.Fprintln(c.out, "No active incidents.")
		return nil
	}

	w := tabwriter.NewWriter(c.out, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "ID\tSEVERITY\tSTATUS\tNAMESPACE\tSERVICE\tTITLE")
	for _, inc := range incidents {
		fmt.Fprintf(w, "%s\t%s\t%s\t%s\t%s\t%s\n",
			inc.ID, inc.Severity, inc.Status, inc.Namespace, inc.Service, inc.Title)
	}
	return w.Flush()
}

func (c *CLI) cmdAnalyze(args []string) error {
	if len(args) != 1 {
		return errors.New("usage: tagent analyze <incident-id>")
	}

	incidentID := args[0]
	incident, ok, err := c.resolveIncident(incidentID)
	if err != nil {
		return err
	}
	if !ok {
		return fmt.Errorf("incident %s not found", incidentID)
	}

	var analysis analysisResponse
	if err := c.postJSON("/api/v1/ai/analyze", map[string]any{"incident_id": incidentID, "telemetry": incidentTelemetry(incident)}, &analysis); err == nil {
		fmt.Fprintf(c.out, "Analysis for %s\n", incidentID)
		fmt.Fprintf(c.out, "Severity: %s\n", defaultString(analysis.Severity, incident.Severity))
		fmt.Fprintf(c.out, "Summary:  %s\n\n", defaultString(analysis.Summary, "No structured summary returned."))
	}

	prompt := fmt.Sprintf(
		"Analyze incident %s and recommend a remediation. Title: %s. Severity: %s. Namespace: %s. Service: %s. Root cause: %s. Evidence: %s.",
		incident.ID, incident.Title, incident.Severity, incident.Namespace, incident.Service, incident.RootCause, strings.Join(incident.Evidence, "; "),
	)
	var chat chatResponse
	if err := c.postJSON("/api/v1/ai/chat", map[string]string{"message": prompt}, &chat); err != nil {
		return err
	}
	fmt.Fprintln(c.out, "AI recommendation:")
	fmt.Fprintf(c.out, "%s\n", strings.TrimSpace(chat.Response))
	if chat.Model != "" {
		fmt.Fprintf(c.out, "\nmodel=%s source=%s\n", chat.Model, chat.ContextSource)
	}
	return nil
}

func (c *CLI) cmdRemediate(args []string) error {
	dryRun, reason, positional, err := parseRemediateArgs(args)
	if err != nil {
		return err
	}

	var req remediationRequest
	switch len(positional) {
	case 1:
		incident, ok, err := c.resolveIncident(positional[0])
		if err != nil {
			return err
		}
		if !ok {
			return fmt.Errorf("incident %s not found", positional[0])
		}
		inferred, err := remediationForIncident(incident)
		if err != nil {
			return err
		}
		req = inferred
	case 2:
		namespace, target, err := splitNamespacedTarget(positional[1])
		if err != nil {
			return err
		}
		req = remediationRequest{Action: positional[0], Namespace: namespace, Target: target}
	default:
		return errors.New("usage: tagent remediate <incident-id> [--dry-run] OR tagent remediate <action> <namespace/name> [--dry-run]")
	}

	req.DryRun = dryRun
	if reason != "" {
		req.Reason = reason
	}
	if req.Reason == "" {
		req.Reason = "requested by tagent CLI"
	}

	var result remediationResult
	if err := c.postJSON("/api/v1/remediation/execute", req, &result); err != nil {
		return err
	}

	if result.DryRun {
		fmt.Fprintln(c.out, "[DRY RUN]")
	}
	fmt.Fprintf(c.out, "Action:  %s\n", result.Action)
	fmt.Fprintf(c.out, "Target:  %s\n", result.Target)
	fmt.Fprintf(c.out, "Status:  %s\n", result.Status)
	fmt.Fprintf(c.out, "Message: %s\n", result.Message)
	if result.Reason != "" {
		fmt.Fprintf(c.out, "Reason:  %s\n", result.Reason)
	}
	return nil
}

func (c *CLI) cmdStatus() error {
	var data map[string]any
	if err := c.getJSON("/api/v1/clusters", &data); err != nil {
		return err
	}
	fmt.Fprintln(c.out, "Cluster Status:")
	fmt.Fprintf(c.out, "  Nodes:       %v ready / %v total\n", data["ready_nodes"], data["total_nodes"])
	fmt.Fprintf(c.out, "  Pods:        %v running / %v total (%v failed)\n", data["running_pods"], data["total_pods"], data["failed_pods"])
	fmt.Fprintf(c.out, "  Deployments: %v\n", data["total_deployments"])
	fmt.Fprintf(c.out, "  Services:    %v\n", data["total_services"])
	return nil
}

func (c *CLI) cmdPods() error {
	var pods []map[string]any
	if err := c.getJSON("/api/v1/pods", &pods); err != nil {
		return err
	}
	if len(pods) == 0 {
		fmt.Fprintln(c.out, "No pods found.")
		return nil
	}
	w := tabwriter.NewWriter(c.out, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "NAMESPACE\tNAME\tSTATUS\tRESTARTS\tNODE")
	for _, p := range pods {
		fmt.Fprintf(w, "%v\t%v\t%v\t%v\t%v\n", p["namespace"], p["name"], p["status"], p["restarts"], p["node"])
	}
	return w.Flush()
}

func (c *CLI) cmdNodes() error {
	var nodes []map[string]any
	if err := c.getJSON("/api/v1/nodes", &nodes); err != nil {
		return err
	}
	if len(nodes) == 0 {
		fmt.Fprintln(c.out, "No nodes found.")
		return nil
	}
	w := tabwriter.NewWriter(c.out, 0, 0, 2, ' ', 0)
	fmt.Fprintln(w, "NAME\tSTATUS\tROLE\tCPU\tMEMORY\tIP")
	for _, n := range nodes {
		fmt.Fprintf(w, "%v\t%v\t%v\t%v\t%v\t%v\n", n["name"], n["status"], n["role"], n["cpu_capacity"], n["memory_capacity"], n["internal_ip"])
	}
	return w.Flush()
}

func (c *CLI) cmdChat(question string) error {
	var result chatResponse
	if err := c.postJSON("/api/v1/ai/chat", map[string]string{"message": question}, &result); err != nil {
		return err
	}
	fmt.Fprintf(c.out, "%s\n", strings.TrimSpace(result.Response))
	if result.Model != "" {
		fmt.Fprintf(c.out, "\nmodel=%s source=%s\n", result.Model, result.ContextSource)
	}
	return nil
}

func (c *CLI) cmdGuardian(args []string) error {
	if len(args) > 0 {
		switch args[0] {
		case "enable":
			var result map[string]any
			return c.postJSON("/api/v1/guardian/enable", map[string]any{}, &result)
		case "disable":
			var result map[string]any
			return c.postJSON("/api/v1/guardian/disable", map[string]any{}, &result)
		}
	}

	var data map[string]any
	if err := c.getJSON("/api/v1/guardian/status", &data); err != nil {
		return err
	}
	fmt.Fprintf(c.out, "Night Guardian: %s\n", boolStr(data["enabled"]))
	fmt.Fprintf(c.out, "Confidence:     %v%%\n", data["confidence"])
	return nil
}

func (c *CLI) cmdHealth() error {
	var data map[string]any
	if err := c.getJSON("/health", &data); err != nil {
		return err
	}
	fmt.Fprintf(c.out, "Status:  %v\n", data["status"])
	fmt.Fprintf(c.out, "Service: %v\n", data["service"])
	if version, ok := data["version"]; ok {
		fmt.Fprintf(c.out, "Version: %v\n", version)
	}
	return nil
}

func (c *CLI) fetchIncidents(stored bool) ([]Incident, error) {
	path := "/api/v1/incidents"
	if stored {
		path = "/api/v1/incidents/stored"
	}
	var data incidentListResponse
	if err := c.getJSON(path, &data); err != nil {
		return nil, err
	}
	return data.Incidents, nil
}

func (c *CLI) resolveIncident(id string) (Incident, bool, error) {
	incidents, err := c.fetchIncidents(false)
	if err != nil {
		return Incident{}, false, err
	}
	if incident, ok := findIncident(incidents, id); ok {
		return incident, true, nil
	}
	incidents, err = c.fetchIncidents(true)
	if err != nil {
		return Incident{}, false, err
	}
	incident, ok := findIncident(incidents, id)
	return incident, ok, nil
}

func (c *CLI) printIncidentDetail(inc Incident) {
	fmt.Fprintf(c.out, "ID:        %s\n", inc.ID)
	fmt.Fprintf(c.out, "Title:     %s\n", inc.Title)
	fmt.Fprintf(c.out, "Severity:  %s\n", inc.Severity)
	fmt.Fprintf(c.out, "Status:    %s\n", inc.Status)
	fmt.Fprintf(c.out, "Namespace: %s\n", inc.Namespace)
	fmt.Fprintf(c.out, "Service:   %s\n", inc.Service)
	if inc.Node != "" {
		fmt.Fprintf(c.out, "Node:      %s\n", inc.Node)
	}
	if inc.RootCause != "" {
		fmt.Fprintf(c.out, "\nRoot cause:\n%s\n", inc.RootCause)
	}
	if len(inc.Evidence) > 0 {
		fmt.Fprintln(c.out, "\nEvidence:")
		for _, item := range inc.Evidence {
			fmt.Fprintf(c.out, "  - %s\n", item)
		}
	}
}

func (c *CLI) getJSON(path string, out any) error {
	req, err := http.NewRequest(http.MethodGet, c.apiURL+path, nil)
	if err != nil {
		return err
	}
	return c.doJSON(req, out)
}

func (c *CLI) postJSON(path string, payload any, out any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequest(http.MethodPost, c.apiURL+path, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	return c.doJSON(req, out)
}

func (c *CLI) doJSON(req *http.Request, out any) error {
	resp, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("cannot reach API at %s: %w", c.apiURL, err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return fmt.Errorf("API %s returned %d: %s", req.URL.Path, resp.StatusCode, strings.TrimSpace(string(body)))
	}
	if out == nil || len(bytes.TrimSpace(body)) == 0 {
		return nil
	}
	if err := json.Unmarshal(body, out); err != nil {
		return fmt.Errorf("decode API %s response: %w", req.URL.Path, err)
	}
	return nil
}

func remediationForIncident(inc Incident) (remediationRequest, error) {
	if strings.Contains(strings.ToLower(inc.Title+" "+inc.RootCause), "node") && inc.Service == "infrastructure" {
		return remediationRequest{}, fmt.Errorf("incident %s affects a node; automatic CLI remediation is not available", inc.ID)
	}

	namespace, pod := podTargetFromIncident(inc)
	if namespace == "" || pod == "" {
		return remediationRequest{}, fmt.Errorf("could not infer pod target for incident %s; use: tagent remediate <action> <namespace/name>", inc.ID)
	}

	return remediationRequest{
		Action:    "restart-pod",
		Namespace: namespace,
		Target:    pod,
		Reason:    fmt.Sprintf("%s: %s", inc.ID, inc.Title),
	}, nil
}

func podTargetFromIncident(inc Incident) (string, string) {
	patterns := []*regexp.Regexp{
		regexp.MustCompile(`(?i)\bpod\s+([a-z0-9.-]+)/([a-z0-9._-]+)`),
		regexp.MustCompile(`(?i)\bpod=([a-z0-9.-]+)/([a-z0-9._-]+)`),
	}
	for _, evidence := range inc.Evidence {
		for _, pattern := range patterns {
			matches := pattern.FindStringSubmatch(evidence)
			if len(matches) == 3 {
				return matches[1], matches[2]
			}
		}
	}
	if inc.Namespace != "" && inc.Service != "" && inc.Service != "infrastructure" {
		return inc.Namespace, inc.Service
	}
	return "", ""
}

func splitNamespacedTarget(value string) (string, string, error) {
	parts := strings.SplitN(value, "/", 2)
	if len(parts) != 2 || parts[0] == "" || parts[1] == "" {
		return "", "", errors.New("target must be namespace/name, for example production/checkout-api")
	}
	return parts[0], parts[1], nil
}

func parseIncidentsArgs(args []string) (bool, []string, error) {
	stored := false
	positional := []string{}
	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "--stored":
			stored = true
		default:
			if strings.HasPrefix(args[i], "-") {
				return false, nil, fmt.Errorf("unknown incidents option %s", args[i])
			}
			positional = append(positional, args[i])
		}
	}
	if len(positional) > 1 {
		return false, nil, errors.New("usage: tagent incidents [incident-id] [--stored]")
	}
	return stored, positional, nil
}

func parseRemediateArgs(args []string) (bool, string, []string, error) {
	dryRun := false
	reason := ""
	positional := []string{}
	for i := 0; i < len(args); i++ {
		switch args[i] {
		case "--dry-run":
			dryRun = true
		case "--reason":
			i++
			if i >= len(args) {
				return false, "", nil, errors.New("--reason requires a value")
			}
			reason = args[i]
		default:
			if strings.HasPrefix(args[i], "-") {
				return false, "", nil, fmt.Errorf("unknown remediate option %s", args[i])
			}
			positional = append(positional, args[i])
		}
	}
	return dryRun, reason, positional, nil
}

func findIncident(items []Incident, id string) (Incident, bool) {
	for _, item := range items {
		if strings.EqualFold(item.ID, id) {
			return item, true
		}
	}
	return Incident{}, false
}

func incidentTelemetry(inc Incident) map[string]any {
	return map[string]any{
		"title":      inc.Title,
		"severity":   inc.Severity,
		"status":     inc.Status,
		"namespace":  inc.Namespace,
		"service":    inc.Service,
		"node":       inc.Node,
		"root_cause": inc.RootCause,
		"evidence":   inc.Evidence,
	}
}

func boolStr(v any) string {
	if value, ok := v.(bool); ok && value {
		return "ENABLED"
	}
	return "DISABLED"
}

func defaultString(value, fallback string) string {
	if value == "" {
		return fallback
	}
	return value
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
