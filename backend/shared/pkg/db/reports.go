package db

import (
	"context"
	"time"
)

type Report struct {
	ID          string    `json:"id"`
	IncidentID  string    `json:"incident_id"`
	Title       string    `json:"title"`
	Severity    string    `json:"severity"`
	Duration    string    `json:"duration"`
	Content     string    `json:"content"`
	GeneratedAt time.Time `json:"generated_at"`
}

func InsertReport(ctx context.Context, r Report) error {
	_, err := Pool.Exec(ctx,
		`INSERT INTO reports (id, incident_id, title, severity, duration, content) VALUES ($1, $2, $3, $4, $5, $6)
		 ON CONFLICT (id) DO NOTHING`,
		r.ID, r.IncidentID, r.Title, r.Severity, r.Duration, r.Content,
	)
	return err
}

func GetReports(ctx context.Context) ([]Report, error) {
	rows, err := Pool.Query(ctx, `SELECT id, incident_id, title, severity, duration, content, generated_at FROM reports ORDER BY generated_at DESC LIMIT 50`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var reports []Report
	for rows.Next() {
		var r Report
		rows.Scan(&r.ID, &r.IncidentID, &r.Title, &r.Severity, &r.Duration, &r.Content, &r.GeneratedAt)
		reports = append(reports, r)
	}
	return reports, nil
}
