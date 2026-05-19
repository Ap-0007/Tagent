package db

import (
	"context"
	"time"
)

type AuditEntry struct {
	ID         int       `json:"id"`
	Actor      string    `json:"actor"`
	Action     string    `json:"action"`
	Target     string    `json:"target"`
	Result     string    `json:"result"`
	IncidentID string    `json:"incident_id"`
	CreatedAt  time.Time `json:"created_at"`
}

func InsertAudit(ctx context.Context, actor, action, target, result, incidentID string) error {
	_, err := Pool.Exec(ctx,
		`INSERT INTO audit_log (actor, action, target, result, incident_id) VALUES ($1, $2, $3, $4, $5)`,
		actor, action, target, result, incidentID,
	)
	return err
}

func GetAuditLog(ctx context.Context, limit int) ([]AuditEntry, error) {
	if limit <= 0 {
		limit = 50
	}
	rows, err := Pool.Query(ctx, `SELECT id, actor, action, target, result, COALESCE(incident_id,''), created_at FROM audit_log ORDER BY created_at DESC LIMIT $1`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var entries []AuditEntry
	for rows.Next() {
		var e AuditEntry
		rows.Scan(&e.ID, &e.Actor, &e.Action, &e.Target, &e.Result, &e.IncidentID, &e.CreatedAt)
		entries = append(entries, e)
	}
	return entries, nil
}
