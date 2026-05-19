package db

import (
	"context"
	"encoding/json"
	"time"
)

type Incident struct {
	ID         string    `json:"id"`
	Title      string    `json:"title"`
	Severity   string    `json:"severity"`
	Status     string    `json:"status"`
	Service    string    `json:"service"`
	Namespace  string    `json:"namespace"`
	Node       string    `json:"node"`
	RootCause  string    `json:"root_cause"`
	Evidence   []string  `json:"evidence"`
	DetectedAt time.Time `json:"detected_at"`
	ResolvedAt *time.Time `json:"resolved_at,omitempty"`
}

func InsertIncident(ctx context.Context, inc Incident) error {
	evidence, _ := json.Marshal(inc.Evidence)
	_, err := Pool.Exec(ctx,
		`INSERT INTO incidents (id, title, severity, status, service, namespace, node, root_cause, evidence, detected_at)
		 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		 ON CONFLICT (id) DO NOTHING`,
		inc.ID, inc.Title, inc.Severity, inc.Status, inc.Service, inc.Namespace, inc.Node, inc.RootCause, evidence, inc.DetectedAt,
	)
	return err
}

func GetIncidents(ctx context.Context, status string) ([]Incident, error) {
	query := `SELECT id, title, severity, status, service, namespace, node, root_cause, evidence, detected_at, resolved_at FROM incidents`
	if status != "" {
		query += ` WHERE status = '` + status + `'`
	}
	query += ` ORDER BY detected_at DESC LIMIT 100`

	rows, err := Pool.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var incidents []Incident
	for rows.Next() {
		var inc Incident
		var evidence []byte
		err := rows.Scan(&inc.ID, &inc.Title, &inc.Severity, &inc.Status, &inc.Service, &inc.Namespace, &inc.Node, &inc.RootCause, &evidence, &inc.DetectedAt, &inc.ResolvedAt)
		if err != nil {
			continue
		}
		json.Unmarshal(evidence, &inc.Evidence)
		incidents = append(incidents, inc)
	}
	return incidents, nil
}

func ResolveIncident(ctx context.Context, id string) error {
	now := time.Now().UTC()
	_, err := Pool.Exec(ctx, `UPDATE incidents SET status = 'resolved', resolved_at = $1 WHERE id = $2`, now, id)
	return err
}
