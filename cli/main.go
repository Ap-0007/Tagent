// Tagent CLI — command-line interface for Kubernetes AI SRE operations.
//
// Usage:
//   tagent incidents          — list active incidents
//   tagent incidents <id>     — show incident detail
//   tagent analyze <query>    — ask AI to analyze a problem
//   tagent chat <message>     — ask AI a question about your cluster
//   tagent status             — show cluster health summary
//   tagent remediate <action> — execute remediation (restart-pod, scale-deployment)
//   tagent guardian           — show Night Guardian status
//   tagent risks              — show service risk scores
//   tagent version            — show CLI version

package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/fatih/color"
	"github.com/olekukonko/tablewriter"
	"github.com/spf13/cobra"
)

var (
	version   = "dev"
	apiURL    string
	noColor   bool
)

func main() {
	rootCmd := &cobra.Command{
		Use:   "tagent",
		Short: "Tagent — AI-Powered Kubernetes SRE CLI",
		Long: `Tagent CLI provides command-line access to your AI SRE platform.
Monitor incidents, analyze problems, execute remediations, and chat with your cluster AI.

Requires a running Tagent API Gateway. Set TAGENT_API_URL or use --api flag.`,
	}

	rootCmd.PersistentFlags().StringVar(&apiURL, "api", "", "API Gateway URL (default: http://localhost:8080)")
	rootCmd.PersistentFlags().BoolVar(&noColor, "no-color", false, "Disable colored output")

	rootCmd.AddCommand(
		incidentsCmd(),
		analyzeCmd(),
		chatCmd(),
		statusCmd(),
		remediateCmd(),
		guardianCmd(),
		risksCmd(),
		versionCmd(),
	)

	if err := rootCmd.Execute(); err != nil {
		os.Exit(1)
	}
}

func getAPIURL() string {
	if apiURL != "" {
		return strings.TrimRight(apiURL, "/")
	}
	if env := os.Getenv("TAGENT_API_URL"); env != "" {
		return strings.TrimRight(env, "/")
	}
	return "http://localhost:8080"
}

func apiGet(path string) ([]byte, error) {
	url := getAPIURL() + path
	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return nil, fmt.Errorf("cannot reach API Gateway at %s: %w", getAPIURL(), err)
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

func apiPost(path string, body interface{}) ([]byte, error) {
	url := getAPIURL() + path
	client := &http.Client{Timeout: 60 * time.Second}
	data, _ := json.Marshal(body)
	resp, err := client.Post(url, "application/json", strings.NewReader(string(data)))
	if err != nil {
		return nil, fmt.Errorf("cannot reach API Gateway at %s: %w", getAPIURL(), err)
	}
	defer resp.Body.Close()
	return io.ReadAll(resp.Body)
}

// ===== Commands =====

func incidentsCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:   "incidents [id]",
		Short: "List active incidents or show detail for one",
		Args:  cobra.MaximumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			if len(args) == 1 {
				return showIncident(args[0])
			}
			return listIncidents()
		},
	}
	return cmd
}

func listIncidents() error {
	data, err := apiGet("/api/v1/incidents")
	if err != nil {
		return err
	}

	var result struct {
		Incidents []struct {
			ID        string `json:"id"`
			Title     string `json:"title"`
			Severity  string `json:"severity"`
			Status    string `json:"status"`
			Service   string `json:"service"`
			Namespace string `json:"namespace"`
		} `json:"incidents"`
		Total int `json:"total"`
	}
	json.Unmarshal(data, &result)

	if len(result.Incidents) == 0 {
		color.Green("✓ No active incidents. All clear.")
		return nil
	}

	fmt.Printf("\n%s Active Incidents (%d)\n\n", color.RedString("●"), result.Total)

	table := tablewriter.NewWriter(os.Stdout)
	table.SetHeader([]string{"ID", "Severity", "Status", "Service", "Title"})
	table.SetBorder(false)
	table.SetColumnSeparator(" ")

	for _, inc := range result.Incidents {
		sev := inc.Severity
		switch sev {
		case "critical":
			sev = color.RedString(sev)
		case "high":
			sev = color.YellowString(sev)
		case "medium":
			sev = color.CyanString(sev)
		}
		table.Append([]string{inc.ID, sev, inc.Status, inc.Namespace + "/" + inc.Service, truncate(inc.Title, 50)})
	}
	table.Render()
	return nil
}

func showIncident(id string) error {
	data, err := apiGet("/api/v1/incidents/" + id)
	if err != nil {
		return err
	}

	var inc struct {
		ID        string   `json:"id"`
		Title     string   `json:"title"`
		Severity  string   `json:"severity"`
		Status    string   `json:"status"`
		Service   string   `json:"service"`
		Namespace string   `json:"namespace"`
		RootCause string   `json:"root_cause"`
		Evidence  []string `json:"evidence"`
	}
	json.Unmarshal(data, &inc)

	if inc.ID == "" {
		return fmt.Errorf("incident %s not found", id)
	}

	fmt.Printf("\n%s Incident: %s\n", color.RedString("●"), inc.ID)
	fmt.Printf("  Title:     %s\n", color.WhiteString(inc.Title))
	fmt.Printf("  Severity:  %s\n", colorSeverity(inc.Severity))
	fmt.Printf("  Status:    %s\n", inc.Status)
	fmt.Printf("  Service:   %s/%s\n", inc.Namespace, inc.Service)
	if inc.RootCause != "" {
		fmt.Printf("  Root Cause: %s\n", color.YellowString(inc.RootCause))
	}
	if len(inc.Evidence) > 0 {
		fmt.Printf("  Evidence:\n")
		for _, e := range inc.Evidence {
			fmt.Printf("    - %s\n", e)
		}
	}
	fmt.Println()
	return nil
}

func analyzeCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "analyze <query>",
		Short: "Ask AI to analyze a problem or incident",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			query := strings.Join(args, " ")
			fmt.Printf("%s Analyzing: %s\n\n", color.CyanString("⟳"), query)

			body, err := apiPost("/api/v1/ai/chat", map[string]string{"message": query})
			if err != nil {
				return err
			}

			var result struct {
				Response      string `json:"response"`
				Model         string `json:"model"`
				ContextSource string `json:"context_source"`
			}
			json.Unmarshal(body, &result)

			fmt.Printf("%s AI Response (model: %s, source: %s):\n\n", color.GreenString("✓"), result.Model, result.ContextSource)
			fmt.Println(result.Response)
			fmt.Println()
			return nil
		},
	}
}

func chatCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "chat <message>",
		Short: "Chat with Tagent AI about your cluster",
		Args:  cobra.MinimumNArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			message := strings.Join(args, " ")
			fmt.Printf("%s You: %s\n", color.BlueString("→"), message)

			body, err := apiPost("/api/v1/ai/chat", map[string]string{"message": message})
			if err != nil {
				return err
			}

			var result struct {
				Response string `json:"response"`
				Model    string `json:"model"`
			}
			json.Unmarshal(body, &result)

			fmt.Printf("%s Tagent: %s\n", color.GreenString("←"), result.Response)
			return nil
		},
	}
}

func statusCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "status",
		Short: "Show cluster health summary",
		RunE: func(cmd *cobra.Command, args []string) error {
			data, err := apiGet("/api/v1/clusters")
			if err != nil {
				return err
			}

			var summary struct {
				TotalNodes       int `json:"total_nodes"`
				ReadyNodes       int `json:"ready_nodes"`
				TotalPods        int `json:"total_pods"`
				RunningPods      int `json:"running_pods"`
				FailedPods       int `json:"failed_pods"`
				TotalDeployments int `json:"total_deployments"`
				TotalServices    int `json:"total_services"`
			}
			json.Unmarshal(data, &summary)

			health := "HEALTHY"
			healthColor := color.GreenString
			if summary.FailedPods > 0 {
				health = "DEGRADED"
				healthColor = color.YellowString
			}
			if summary.ReadyNodes < summary.TotalNodes {
				health = "WARNING"
				healthColor = color.RedString
			}

			fmt.Printf("\n%s Cluster Status: %s\n\n", color.CyanString("⎈"), healthColor(health))

			table := tablewriter.NewWriter(os.Stdout)
			table.SetBorder(false)
			table.SetColumnSeparator("  ")
			table.Append([]string{"Nodes", fmt.Sprintf("%d/%d Ready", summary.ReadyNodes, summary.TotalNodes)})
			table.Append([]string{"Pods", fmt.Sprintf("%d Running, %d Failed, %d Total", summary.RunningPods, summary.FailedPods, summary.TotalPods)})
			table.Append([]string{"Deployments", fmt.Sprintf("%d", summary.TotalDeployments)})
			table.Append([]string{"Services", fmt.Sprintf("%d", summary.TotalServices)})
			table.Render()
			fmt.Println()
			return nil
		},
	}
}

func remediateCmd() *cobra.Command {
	var namespace, target string
	var dryRun bool

	cmd := &cobra.Command{
		Use:   "remediate <action>",
		Short: "Execute a remediation action (restart-pod, scale-deployment)",
		Long:  "Actions: restart-pod, scale-deployment\nExample: tagent remediate restart-pod -n production -t payment-api-xyz",
		Args:  cobra.ExactArgs(1),
		RunE: func(cmd *cobra.Command, args []string) error {
			action := args[0]
			if namespace == "" || target == "" {
				return fmt.Errorf("--namespace (-n) and --target (-t) are required")
			}

			payload := map[string]interface{}{
				"action":    action,
				"namespace": namespace,
				"target":    target,
				"dry_run":   dryRun,
			}

			mode := "EXECUTE"
			if dryRun {
				mode = "DRY-RUN"
			}
			fmt.Printf("%s [%s] %s on %s/%s\n", color.YellowString("⟳"), mode, action, namespace, target)

			body, err := apiPost("/api/v1/remediation/execute", payload)
			if err != nil {
				return err
			}

			var result struct {
				Action  string `json:"action"`
				Target  string `json:"target"`
				Status  string `json:"status"`
				Message string `json:"message"`
				DryRun  bool   `json:"dry_run"`
			}
			json.Unmarshal(body, &result)

			switch result.Status {
			case "success":
				fmt.Printf("%s %s\n", color.GreenString("✓"), result.Message)
			case "dry-run":
				fmt.Printf("%s [DRY-RUN] %s\n", color.CyanString("ℹ"), result.Message)
			case "blocked":
				fmt.Printf("%s %s\n", color.RedString("✗"), result.Message)
			default:
				fmt.Printf("%s %s: %s\n", color.RedString("✗"), result.Status, result.Message)
			}
			return nil
		},
	}

	cmd.Flags().StringVarP(&namespace, "namespace", "n", "", "Target namespace")
	cmd.Flags().StringVarP(&target, "target", "t", "", "Target resource name")
	cmd.Flags().BoolVar(&dryRun, "dry-run", false, "Simulate without executing")
	return cmd
}

func guardianCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "guardian",
		Short: "Show Night Guardian status",
		RunE: func(cmd *cobra.Command, args []string) error {
			data, err := apiGet("/api/v1/night-guardian/status")
			if err != nil {
				return err
			}

			var status struct {
				Config struct {
					Enabled    bool `json:"enabled"`
					AutoFix    bool `json:"auto_fix"`
					Confidence int  `json:"confidence"`
				} `json:"config"`
				RunCount    int    `json:"run_count"`
				ReportCount int    `json:"report_count"`
				Mode        string `json:"mode"`
			}
			json.Unmarshal(data, &status)

			enabled := color.RedString("DISABLED")
			if status.Config.Enabled {
				enabled = color.GreenString("ENABLED")
			}

			fmt.Printf("\n%s Night Guardian: %s\n\n", color.MagentaString("🛡"), enabled)
			fmt.Printf("  Mode:            %s\n", status.Mode)
			fmt.Printf("  Auto-Fix:        %v\n", status.Config.AutoFix)
			fmt.Printf("  Confidence:      %d%%\n", status.Config.Confidence)
			fmt.Printf("  Total Runs:      %d\n", status.RunCount)
			fmt.Printf("  Total Reports:   %d\n", status.ReportCount)
			fmt.Println()
			return nil
		},
	}
}

func risksCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "risks",
		Short: "Show service risk scores",
		RunE: func(cmd *cobra.Command, args []string) error {
			data, err := apiGet("/api/v1/risks/scores")
			if err != nil {
				return err
			}

			var result struct {
				Services []struct {
					Service   string `json:"service"`
					Namespace string `json:"namespace"`
					RiskScore int    `json:"risk_score"`
					RiskLevel string `json:"risk_level"`
					Prediction string `json:"prediction"`
				} `json:"services"`
				Total int `json:"total"`
			}
			json.Unmarshal(data, &result)

			if len(result.Services) == 0 {
				color.Green("✓ No risks detected. All services healthy.")
				return nil
			}

			fmt.Printf("\n%s Service Risk Scores (%d services)\n\n", color.YellowString("⚠"), result.Total)

			table := tablewriter.NewWriter(os.Stdout)
			table.SetHeader([]string{"Score", "Level", "Service", "Prediction"})
			table.SetBorder(false)
			table.SetColumnSeparator(" ")

			for _, s := range result.Services {
				if s.RiskScore == 0 {
					continue
				}
				score := fmt.Sprintf("%d", s.RiskScore)
				level := s.RiskLevel
				switch level {
				case "critical":
					score = color.RedString(score)
					level = color.RedString(level)
				case "high":
					score = color.YellowString(score)
					level = color.YellowString(level)
				case "medium":
					score = color.CyanString(score)
					level = color.CyanString(level)
				}
				table.Append([]string{score, level, s.Namespace + "/" + s.Service, truncate(s.Prediction, 50)})
			}
			table.Render()
			fmt.Println()
			return nil
		},
	}
}

func versionCmd() *cobra.Command {
	return &cobra.Command{
		Use:   "version",
		Short: "Show CLI version",
		Run: func(cmd *cobra.Command, args []string) {
			fmt.Printf("tagent version %s\n", version)
		},
	}
}

// ===== Helpers =====

func truncate(s string, n int) string {
	if len(s) <= n {
		return s
	}
	return s[:n-3] + "..."
}

func colorSeverity(s string) string {
	switch s {
	case "critical":
		return color.RedString(s)
	case "high":
		return color.YellowString(s)
	case "medium":
		return color.CyanString(s)
	default:
		return s
	}
}
