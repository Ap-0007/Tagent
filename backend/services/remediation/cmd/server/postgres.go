package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"log"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type Store struct {
	db *sql.DB
}

type StoredIncident struct {
	ID         string          `json:"id"`
	Title      string          `json:"title"`
	Severity   string          `json:"severity"`
	Status     string          `json:"status"`
	Service    string          `json:"service"`
	Namespace  string          `json:"namespace"`
	RootCause  string          `json:"rootCause"`
	Evidence   []string        `json:"evidence"`
	Metadata   json.RawMessage `json:"metadata,omitempty"`
	DetectedAt string          `json:"detected_at"`
	StartedAt  string          `json:"startedAt"`
}

type AuditLog struct {
	ID        int64           `json:"id"`
	Actor     string          `json:"actor"`
	Action    string          `json:"action"`
	Target    string          `json:"target"`
	Result    string          `json:"result"`
	DryRun    bool            `json:"dry_run"`
	Message   string          `json:"message"`
	Reason    string          `json:"reason"`
	Payload   json.RawMessage `json:"payload,omitempty"`
	CreatedAt string          `json:"created_at"`
}

func initStore(ctx context.Context, databaseURL string) *Store {
	if databaseURL == "" {
		log.Printf("PostgreSQL disabled: DATABASE_URL is empty")
		return nil
	}
	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		log.Printf("PostgreSQL disabled: open failed: %v", err)
		return nil
	}
	db.SetMaxOpenConns(5)
	db.SetMaxIdleConns(2)
	db.SetConnMaxLifetime(30 * time.Minute)
	if err := db.PingContext(ctx); err != nil {
		log.Printf("PostgreSQL disabled: ping failed: %v", err)
		_ = db.Close()
		return nil
	}
	store := &Store{db: db}
	if err := store.migrate(ctx); err != nil {
		log.Printf("PostgreSQL disabled: migration failed: %v", err)
		_ = db.Close()
		return nil
	}
	log.Printf("PostgreSQL persistence enabled")
	return store
}

func (s *Store) migrate(ctx context.Context) error {
	_, err := s.db.ExecContext(ctx, `
CREATE TABLE IF NOT EXISTS incidents (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	severity TEXT NOT NULL,
	status TEXT NOT NULL,
	service TEXT NOT NULL,
	namespace TEXT NOT NULL,
	root_cause TEXT NOT NULL,
	evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
	metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
	detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS reports (
	id TEXT PRIMARY KEY,
	incident_id TEXT NOT NULL,
	title TEXT NOT NULL,
	severity TEXT NOT NULL,
	status TEXT NOT NULL,
	namespace TEXT NOT NULL,
	target TEXT NOT NULL,
	content TEXT NOT NULL,
	payload JSONB NOT NULL DEFAULT '{}'::jsonb,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS audit_logs (
	id BIGSERIAL PRIMARY KEY,
	actor TEXT NOT NULL,
	action TEXT NOT NULL,
	target TEXT NOT NULL,
	result TEXT NOT NULL,
	dry_run BOOLEAN NOT NULL,
	message TEXT NOT NULL,
	reason TEXT NOT NULL,
	payload JSONB NOT NULL DEFAULT '{}'::jsonb,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_incidents_detected_at ON incidents (detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_incident_id ON reports (incident_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs (created_at DESC);
`)
	return err
}

func (s *Store) SaveAuditLog(ctx context.Context, result ActionResult) {
	if s == nil {
		return
	}
	payload, _ := json.Marshal(result)
	_, err := s.db.ExecContext(ctx, `
INSERT INTO audit_logs (actor, action, target, result, dry_run, message, reason, payload, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
`, "tagent/remediation", result.Action, result.Target, result.Status, result.DryRun, result.Message, result.Reason, string(payload), parseTimeOrNow(result.Timestamp))
	if err != nil {
		log.Printf("PostgreSQL audit insert failed: %v", err)
	}
}

func (s *Store) SaveGuardianReport(ctx context.Context, report GuardianReport) {
	if s == nil {
		return
	}
	severity := severityForReport(report)
	report.Severity = severity
	report.Content = reportContent(report)
	payload, _ := json.Marshal(report)
	evidence, _ := json.Marshal(report.Evidence)
	metadata, _ := json.Marshal(map[string]any{
		"target":          report.Target,
		"detected_status": report.DetectedStatus,
		"confidence":      report.Confidence,
		"action":          report.Action,
		"dry_run":         report.DryRun,
	})

	_, err := s.db.ExecContext(ctx, `
INSERT INTO incidents (id, title, severity, status, service, namespace, root_cause, evidence, metadata, detected_at, updated_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10, now())
ON CONFLICT (id) DO UPDATE SET
	title = EXCLUDED.title,
	severity = EXCLUDED.severity,
	status = EXCLUDED.status,
	service = EXCLUDED.service,
	namespace = EXCLUDED.namespace,
	root_cause = EXCLUDED.root_cause,
	evidence = EXCLUDED.evidence,
	metadata = EXCLUDED.metadata,
	updated_at = now()
`, report.IncidentID, report.Title, severity, "active", report.Target, report.Namespace, report.Recommendation, string(evidence), string(metadata), parseTimeOrNow(report.CreatedAt))
	if err != nil {
		log.Printf("PostgreSQL incident upsert failed: %v", err)
		return
	}

	_, err = s.db.ExecContext(ctx, `
INSERT INTO reports (id, incident_id, title, severity, status, namespace, target, content, payload, created_at)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10)
ON CONFLICT (id) DO UPDATE SET
	title = EXCLUDED.title,
	severity = EXCLUDED.severity,
	status = EXCLUDED.status,
	content = EXCLUDED.content,
	payload = EXCLUDED.payload,
	created_at = EXCLUDED.created_at
`, report.ID, report.IncidentID, report.Title, severity, report.Result.Status, report.Namespace, report.Target, report.Content, string(payload), parseTimeOrNow(report.CreatedAt))
	if err != nil {
		log.Printf("PostgreSQL report upsert failed: %v", err)
	}
}

func (s *Store) ListActionResults(ctx context.Context, limit int) ([]ActionResult, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT action, target, result, message, dry_run, reason, created_at
FROM audit_logs
ORDER BY created_at DESC
LIMIT $1
`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := []ActionResult{}
	for rows.Next() {
		var item ActionResult
		var created time.Time
		if err := rows.Scan(&item.Action, &item.Target, &item.Status, &item.Message, &item.DryRun, &item.Reason, &created); err != nil {
			return nil, err
		}
		item.Timestamp = created.UTC().Format(time.RFC3339)
		items = append(items, item)
	}
	return items, rows.Err()
}

func (s *Store) ListIncidents(ctx context.Context, limit int) ([]StoredIncident, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT id, title, severity, status, service, namespace, root_cause, evidence, metadata, detected_at
FROM incidents
ORDER BY detected_at DESC
LIMIT $1
`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	incidents := []StoredIncident{}
	for rows.Next() {
		var item StoredIncident
		var evidence []byte
		var detected time.Time
		if err := rows.Scan(&item.ID, &item.Title, &item.Severity, &item.Status, &item.Service, &item.Namespace, &item.RootCause, &evidence, &item.Metadata, &detected); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(evidence, &item.Evidence)
		item.DetectedAt = detected.UTC().Format(time.RFC3339)
		item.StartedAt = item.DetectedAt
		incidents = append(incidents, item)
	}
	return incidents, rows.Err()
}

func (s *Store) ListReports(ctx context.Context, limit int) ([]GuardianReport, error) {
	rows, err := s.db.QueryContext(ctx, `
SELECT severity, content, payload, created_at
FROM reports
ORDER BY created_at DESC
LIMIT $1
`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	reports := []GuardianReport{}
	for rows.Next() {
		var payload []byte
		var severity string
		var content string
		var created time.Time
		if err := rows.Scan(&severity, &content, &payload, &created); err != nil {
			return nil, err
		}
		var item GuardianReport
		if err := json.Unmarshal(payload, &item); err != nil {
			return nil, err
		}
		item.Severity = severity
		item.Content = content
		if item.CreatedAt == "" {
			item.CreatedAt = created.UTC().Format(time.RFC3339)
		}
		reports = append(reports, item)
	}
	return reports, rows.Err()
}

func parseTimeOrNow(value string) time.Time {
	if parsed, err := time.Parse(time.RFC3339, value); err == nil {
		return parsed
	}
	return time.Now().UTC()
}

func severityForReport(report GuardianReport) string {
	if report.Severity != "" {
		return report.Severity
	}
	return severityForConfidence(report.Confidence)
}

func severityForConfidence(confidence int) string {
	if confidence >= 95 {
		return "critical"
	}
	if confidence >= 85 {
		return "high"
	}
	return "medium"
}

func reportContent(report GuardianReport) string {
	if report.Content != "" {
		return report.Content
	}
	return "# " + report.Title + "\n\n" +
		"Incident: " + report.IncidentID + "\n\n" +
		"Target: " + report.Namespace + "/" + report.Target + "\n\n" +
		"Detected: " + report.DetectedStatus + "\n\n" +
		"Recommendation: " + report.Recommendation + "\n\n" +
		"Result: " + report.Result.Status + " - " + report.Result.Message + "\n"
}
