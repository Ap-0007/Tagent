package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var Pool *pgxpool.Pool

// Connect initializes the PostgreSQL connection pool.
func Connect() error {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		dsn = "postgresql://tagent:password@localhost:5432/tagent?sslmode=disable"
	}

	config, err := pgxpool.ParseConfig(dsn)
	if err != nil {
		return fmt.Errorf("parse database URL: %w", err)
	}

	config.MaxConns = 20
	config.MinConns = 2
	config.MaxConnLifetime = 30 * time.Minute

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	Pool, err = pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return fmt.Errorf("connect to database: %w", err)
	}

	if err := Pool.Ping(ctx); err != nil {
		return fmt.Errorf("ping database: %w", err)
	}

	log.Printf("[db] Connected to PostgreSQL (%s)", config.ConnConfig.Host)
	return nil
}

// Migrate creates tables if they don't exist.
func Migrate() error {
	ctx := context.Background()

	schema := `
	CREATE TABLE IF NOT EXISTS incidents (
		id TEXT PRIMARY KEY,
		title TEXT NOT NULL,
		severity TEXT NOT NULL DEFAULT 'medium',
		status TEXT NOT NULL DEFAULT 'active',
		service TEXT,
		namespace TEXT,
		node TEXT,
		root_cause TEXT,
		evidence JSONB DEFAULT '[]',
		detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
		resolved_at TIMESTAMPTZ
	);

	CREATE TABLE IF NOT EXISTS remediation_actions (
		id TEXT PRIMARY KEY,
		incident_id TEXT REFERENCES incidents(id),
		action TEXT NOT NULL,
		target TEXT NOT NULL,
		status TEXT NOT NULL,
		message TEXT,
		dry_run BOOLEAN DEFAULT FALSE,
		executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS reports (
		id TEXT PRIMARY KEY,
		incident_id TEXT REFERENCES incidents(id),
		title TEXT NOT NULL,
		severity TEXT,
		duration TEXT,
		content TEXT,
		generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS audit_log (
		id SERIAL PRIMARY KEY,
		actor TEXT NOT NULL,
		action TEXT NOT NULL,
		target TEXT,
		result TEXT,
		incident_id TEXT,
		created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE TABLE IF NOT EXISTS notifications (
		id SERIAL PRIMARY KEY,
		incident_id TEXT,
		channel TEXT NOT NULL,
		status TEXT NOT NULL,
		message TEXT,
		sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);

	CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
	CREATE INDEX IF NOT EXISTS idx_incidents_detected ON incidents(detected_at DESC);
	CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at DESC);
	CREATE INDEX IF NOT EXISTS idx_actions_incident ON remediation_actions(incident_id);
	`

	_, err := Pool.Exec(ctx, schema)
	if err != nil {
		return fmt.Errorf("migrate: %w", err)
	}

	log.Println("[db] Migration complete")
	return nil
}

// Close shuts down the connection pool.
func Close() {
	if Pool != nil {
		Pool.Close()
	}
}
