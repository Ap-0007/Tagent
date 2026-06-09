package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	_ "github.com/lib/pq"
)

// Report represents a generated incident report.
type Report struct {
	ID         string `json:"id"`
	Title      string `json:"title"`
	Severity   string `json:"severity"`
	Service    string `json:"service"`
	Namespace  string `json:"namespace"`
	Content    string `json:"content"`
	Summary    string `json:"summary"`
	RootCause  string `json:"root_cause"`
	Resolution string `json:"resolution"`
	Duration   string `json:"duration"`
	CreatedAt  string `json:"created_at"`
	ResolvedAt string `json:"resolved_at,omitempty"`
	IncidentID string `json:"incident_id,omitempty"`
	Format     string `json:"format"` // "html", "markdown", "pdf"
}

var db *sql.DB

func main() {
	port := envOr("PORT", "8086")
	databaseURL := envOr("DATABASE_URL", "")
	aiEngineURL := envOr("AI_ENGINE_URL", "http://localhost:8083")

	// Initialize database
	if databaseURL != "" {
		var err error
		db, err = sql.Open("postgres", databaseURL)
		if err != nil {
			log.Printf("WARNING: Database connection failed: %v", err)
		} else {
			if err := db.Ping(); err != nil {
				log.Printf("WARNING: Database ping failed: %v", err)
				db = nil
			} else {
				log.Printf("  Database: connected")
				initSchema()
			}
		}
	}

	router := gin.Default()

	router.GET("/health", func(c *gin.Context) {
		dbStatus := "disconnected"
		if db != nil {
			dbStatus = "connected"
		}
		c.JSON(200, gin.H{"status": "healthy", "service": "tagent-documentation", "database": dbStatus})
	})

	// List all reports
	router.GET("/reports", func(c *gin.Context) {
		reports := listReports()
		c.JSON(200, gin.H{"reports": reports, "total": len(reports)})
	})

	// Get single report
	router.GET("/reports/:id", func(c *gin.Context) {
		report := getReport(c.Param("id"))
		if report == nil {
			c.JSON(404, gin.H{"error": "report not found"})
			return
		}
		c.JSON(200, report)
	})

	// Get report as HTML (for PDF rendering)
	router.GET("/reports/:id/pdf", func(c *gin.Context) {
		report := getReport(c.Param("id"))
		if report == nil {
			c.JSON(404, gin.H{"error": "report not found"})
			return
		}
		html := renderReportHTML(report)
		c.Data(200, "text/html", []byte(html))
	})

	// Generate a new report (uses AI Engine for summary)
	router.POST("/generate", func(c *gin.Context) {
		var req struct {
			IncidentID string `json:"incident_id"`
			Title      string `json:"title"`
			Severity   string `json:"severity"`
			Service    string `json:"service"`
			Namespace  string `json:"namespace"`
			RootCause  string `json:"root_cause"`
			Resolution string `json:"resolution"`
			Duration   string `json:"duration"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		// Generate AI summary via AI Engine
		summary := generateAISummary(aiEngineURL, req.Title, req.RootCause, req.Resolution, req.Service)

		report := Report{
			ID:         uuid.New().String(),
			Title:      req.Title,
			Severity:   req.Severity,
			Service:    req.Service,
			Namespace:  req.Namespace,
			RootCause:  req.RootCause,
			Resolution: req.Resolution,
			Duration:   req.Duration,
			Summary:    summary,
			Content:    buildMarkdownContent(req.Title, req.Severity, req.Service, req.RootCause, req.Resolution, summary),
			CreatedAt:  time.Now().UTC().Format(time.RFC3339),
			IncidentID: req.IncidentID,
			Format:     "markdown",
		}

		saveReport(&report)

		c.JSON(201, gin.H{"status": "generated", "id": report.ID, "report": report})
	})

	// Generate reports for all resolved incidents
	router.POST("/generate-all", func(c *gin.Context) {
		// Fetch incidents from monitoring service
		monitoringURL := envOr("MONITORING_URL", "http://localhost:8082")
		resp, err := http.Get(monitoringURL + "/incidents")
		if err != nil {
			c.JSON(502, gin.H{"error": "cannot reach monitoring service"})
			return
		}
		defer resp.Body.Close()

		var incData struct {
			Incidents []struct {
				ID        string `json:"id"`
				Title     string `json:"title"`
				Severity  string `json:"severity"`
				Service   string `json:"service"`
				Namespace string `json:"namespace"`
				RootCause string `json:"root_cause"`
				Status    string `json:"status"`
			} `json:"incidents"`
		}
		json.NewDecoder(resp.Body).Decode(&incData)

		generated := 0
		for _, inc := range incData.Incidents {
			if inc.Status == "resolved" {
				summary := generateAISummary(aiEngineURL, inc.Title, inc.RootCause, "", inc.Service)
				report := Report{
					ID:         uuid.New().String(),
					Title:      inc.Title,
					Severity:   inc.Severity,
					Service:    inc.Service,
					Namespace:  inc.Namespace,
					RootCause:  inc.RootCause,
					Summary:    summary,
					Content:    buildMarkdownContent(inc.Title, inc.Severity, inc.Service, inc.RootCause, "", summary),
					CreatedAt:  time.Now().UTC().Format(time.RFC3339),
					IncidentID: inc.ID,
					Format:     "markdown",
				}
				saveReport(&report)
				generated++
			}
		}

		c.JSON(200, gin.H{"status": "complete", "generated": generated})
	})

	// Delete a report
	router.DELETE("/reports/:id", func(c *gin.Context) {
		deleteReport(c.Param("id"))
		c.JSON(200, gin.H{"status": "deleted"})
	})

	log.Printf("Tagent Documentation Service starting on port %s", port)
	if err := router.Run(":" + port); err != nil {
		log.Fatalf("Failed to start: %v", err)
	}
}

// ===== Database Operations =====

func initSchema() {
	if db == nil {
		return
	}
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS reports (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			severity TEXT,
			service TEXT,
			namespace TEXT,
			content TEXT,
			summary TEXT,
			root_cause TEXT,
			resolution TEXT,
			duration TEXT,
			created_at TIMESTAMP DEFAULT NOW(),
			resolved_at TIMESTAMP,
			incident_id TEXT,
			format TEXT DEFAULT 'markdown'
		)
	`)
	if err != nil {
		log.Printf("WARNING: Failed to create reports table: %v", err)
	}
}

var inMemoryReports []Report

func listReports() []Report {
	if db != nil {
		rows, err := db.Query("SELECT id, title, severity, service, namespace, content, summary, root_cause, resolution, duration, created_at, incident_id, format FROM reports ORDER BY created_at DESC LIMIT 50")
		if err == nil {
			defer rows.Close()
			var reports []Report
			for rows.Next() {
				var r Report
				rows.Scan(&r.ID, &r.Title, &r.Severity, &r.Service, &r.Namespace, &r.Content, &r.Summary, &r.RootCause, &r.Resolution, &r.Duration, &r.CreatedAt, &r.IncidentID, &r.Format)
				reports = append(reports, r)
			}
			if reports == nil {
				reports = []Report{}
			}
			return reports
		}
	}
	if inMemoryReports == nil {
		return []Report{}
	}
	return inMemoryReports
}

func getReport(id string) *Report {
	if db != nil {
		var r Report
		err := db.QueryRow("SELECT id, title, severity, service, namespace, content, summary, root_cause, resolution, duration, created_at, incident_id, format FROM reports WHERE id=$1", id).
			Scan(&r.ID, &r.Title, &r.Severity, &r.Service, &r.Namespace, &r.Content, &r.Summary, &r.RootCause, &r.Resolution, &r.Duration, &r.CreatedAt, &r.IncidentID, &r.Format)
		if err == nil {
			return &r
		}
	}
	for _, r := range inMemoryReports {
		if r.ID == id {
			return &r
		}
	}
	return nil
}

func saveReport(r *Report) {
	if db != nil {
		_, err := db.Exec("INSERT INTO reports (id, title, severity, service, namespace, content, summary, root_cause, resolution, duration, created_at, incident_id, format) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)",
			r.ID, r.Title, r.Severity, r.Service, r.Namespace, r.Content, r.Summary, r.RootCause, r.Resolution, r.Duration, r.CreatedAt, r.IncidentID, r.Format)
		if err != nil {
			log.Printf("WARNING: Failed to save report to DB: %v", err)
		} else {
			return
		}
	}
	inMemoryReports = append(inMemoryReports, *r)
}

func deleteReport(id string) {
	if db != nil {
		db.Exec("DELETE FROM reports WHERE id=$1", id)
	}
	for i, r := range inMemoryReports {
		if r.ID == id {
			inMemoryReports = append(inMemoryReports[:i], inMemoryReports[i+1:]...)
			return
		}
	}
}

// ===== AI Summary Generation =====

func generateAISummary(aiEngineURL, title, rootCause, resolution, service string) string {
	prompt := fmt.Sprintf("Write a concise incident summary report for: Title: %s, Service: %s, Root Cause: %s, Resolution: %s. Keep it professional and under 200 words.",
		title, service, rootCause, resolution)

	body, _ := json.Marshal(map[string]string{"message": prompt})
	resp, err := http.Post(aiEngineURL+"/api/v1/ai/chat", "application/json", bytes.NewReader(body))
	if err != nil {
		return fmt.Sprintf("Incident '%s' affecting service '%s'. Root cause: %s. Resolution: %s.", title, service, rootCause, resolution)
	}
	defer resp.Body.Close()

	var result struct {
		Response string `json:"response"`
	}
	json.NewDecoder(resp.Body).Decode(&result)
	if result.Response != "" {
		return result.Response
	}
	return fmt.Sprintf("Incident '%s' affecting service '%s'. Root cause: %s.", title, service, rootCause)
}

// ===== Report Rendering =====

func buildMarkdownContent(title, severity, service, rootCause, resolution, summary string) string {
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("# Incident Report: %s\n\n", title))
	sb.WriteString(fmt.Sprintf("**Severity:** %s  \n", severity))
	sb.WriteString(fmt.Sprintf("**Service:** %s  \n", service))
	sb.WriteString(fmt.Sprintf("**Date:** %s  \n\n", time.Now().UTC().Format("2006-01-02 15:04 UTC")))
	sb.WriteString("## Summary\n\n")
	sb.WriteString(summary + "\n\n")
	if rootCause != "" {
		sb.WriteString("## Root Cause\n\n")
		sb.WriteString(rootCause + "\n\n")
	}
	if resolution != "" {
		sb.WriteString("## Resolution\n\n")
		sb.WriteString(resolution + "\n\n")
	}
	sb.WriteString("---\n*Generated by Tagent AI Documentation Service*\n")
	return sb.String()
}

func renderReportHTML(r *Report) string {
	tmpl := `<!DOCTYPE html>
<html>
<head><title>{{.Title}}</title>
<style>
body { font-family: -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #333; }
h1 { color: #1a1a1a; border-bottom: 2px solid #0066cc; padding-bottom: 10px; }
.meta { color: #666; margin-bottom: 20px; }
.severity { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; }
.severity-critical { background: #fee; color: #c33; }
.severity-high { background: #fff3e0; color: #e65100; }
.severity-medium { background: #fff8e1; color: #f9a825; }
.severity-low { background: #e8f5e9; color: #2e7d32; }
h2 { color: #333; margin-top: 24px; }
pre { background: #f5f5f5; padding: 12px; border-radius: 4px; overflow-x: auto; }
footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px; }
</style>
</head>
<body>
<h1>{{.Title}}</h1>
<div class="meta">
<span class="severity severity-{{.Severity}}">{{.Severity}}</span>
&nbsp; Service: <strong>{{.Service}}</strong>
&nbsp; Date: {{.CreatedAt}}
</div>
<h2>Summary</h2>
<p>{{.Summary}}</p>
{{if .RootCause}}<h2>Root Cause</h2><p>{{.RootCause}}</p>{{end}}
{{if .Resolution}}<h2>Resolution</h2><p>{{.Resolution}}</p>{{end}}
{{if .Duration}}<p><strong>Duration:</strong> {{.Duration}}</p>{{end}}
<footer>Generated by Tagent AI Documentation Service</footer>
</body>
</html>`

	t, err := template.New("report").Parse(tmpl)
	if err != nil {
		return "<html><body>Error rendering report</body></html>"
	}
	var buf bytes.Buffer
	t.Execute(&buf, r)
	return buf.String()
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}

// Ensure imports are used
var _ = io.ReadAll
