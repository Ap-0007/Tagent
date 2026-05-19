package main

import (
	"context"
	"os"
	"strings"
	"testing"
	"time"
)

func TestInitStoreDisabledWithoutDatabaseURL(t *testing.T) {
	if got := initStore(context.Background(), ""); got != nil {
		t.Fatal("expected nil store when DATABASE_URL is empty")
	}
}

func TestPostgresStorePersistsAuditIncidentsAndReports(t *testing.T) {
	dsn := os.Getenv("TAGENT_POSTGRES_TEST_DSN")
	if dsn == "" {
		t.Skip("set TAGENT_POSTGRES_TEST_DSN to run PostgreSQL integration test")
	}

	ctx := context.Background()
	store := initStore(ctx, dsn)
	if store == nil {
		t.Fatal("expected PostgreSQL store to initialize")
	}
	defer store.db.Close()

	suffix := time.Now().UTC().Format("20060102150405.000000000")
	incidentID := "INC-test-" + suffix
	reportID := "NGR-test-" + suffix
	target := "default/api-" + suffix
	defer cleanupPostgresTestRows(ctx, t, store, incidentID, reportID, target)

	action := ActionResult{
		Action:    "restart-pod",
		Target:    target,
		Status:    "dry-run",
		Message:   "Would restart pod",
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		DryRun:    true,
		Reason:    "CrashLoopBackOff",
	}
	store.SaveAuditLog(ctx, action)

	report := GuardianReport{
		ID:             reportID,
		IncidentID:     incidentID,
		Title:          "CrashLoopBackOff detected in pod api",
		Namespace:      "default",
		Target:         "api-" + suffix,
		DetectedStatus: "CrashLoopBackOff",
		Confidence:     90,
		Action:         "restart-pod",
		Result:         action,
		Recommendation: "Restart the failing pod.",
		CreatedAt:      time.Now().UTC().Format(time.RFC3339),
		DryRun:         true,
		Evidence:       []string{"pod=" + target, "container=api waiting=CrashLoopBackOff"},
	}
	store.SaveGuardianReport(ctx, report)

	auditRows, err := store.ListActionResults(ctx, 50)
	if err != nil {
		t.Fatalf("list action results: %v", err)
	}
	if !containsActionResult(auditRows, target, "dry-run") {
		t.Fatalf("expected persisted audit result for %s, got %+v", target, auditRows)
	}

	incidents, err := store.ListIncidents(ctx, 50)
	if err != nil {
		t.Fatalf("list incidents: %v", err)
	}
	incident := findIncident(incidents, incidentID)
	if incident == nil {
		t.Fatalf("expected persisted incident %s, got %+v", incidentID, incidents)
	}
	if incident.Severity != "high" || incident.RootCause != report.Recommendation {
		t.Fatalf("unexpected incident fields: %+v", incident)
	}
	if len(incident.Evidence) != 2 {
		t.Fatalf("expected evidence to round-trip, got %+v", incident.Evidence)
	}

	reports, err := store.ListReports(ctx, 50)
	if err != nil {
		t.Fatalf("list reports: %v", err)
	}
	persistedReport := findReport(reports, reportID)
	if persistedReport == nil {
		t.Fatalf("expected persisted report %s, got %+v", reportID, reports)
	}
	if persistedReport.Severity != "high" {
		t.Fatalf("expected report severity high, got %q", persistedReport.Severity)
	}
	if !strings.Contains(persistedReport.Content, "CrashLoopBackOff") {
		t.Fatalf("expected report content to include detection, got %q", persistedReport.Content)
	}
}

func cleanupPostgresTestRows(ctx context.Context, t *testing.T, store *Store, incidentID, reportID, target string) {
	t.Helper()
	_, _ = store.db.ExecContext(ctx, "DELETE FROM audit_logs WHERE target = $1", target)
	_, _ = store.db.ExecContext(ctx, "DELETE FROM reports WHERE id = $1", reportID)
	_, _ = store.db.ExecContext(ctx, "DELETE FROM incidents WHERE id = $1", incidentID)
}

func containsActionResult(items []ActionResult, target, status string) bool {
	for _, item := range items {
		if item.Target == target && item.Status == status {
			return true
		}
	}
	return false
}

func findIncident(items []StoredIncident, id string) *StoredIncident {
	for i := range items {
		if items[i].ID == id {
			return &items[i]
		}
	}
	return nil
}

func findReport(items []GuardianReport, id string) *GuardianReport {
	for i := range items {
		if items[i].ID == id {
			return &items[i]
		}
	}
	return nil
}
