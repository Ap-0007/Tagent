package handlers

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
)

var db *sql.DB

// GetDB returns the database connection (may be nil if not connected)
func GetDB() *sql.DB {
	return db
}

// InitDB connects to PostgreSQL and creates the users table
func InitDB(databaseURL string) error {
	var err error
	db, err = sql.Open("postgres", databaseURL)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	// Test connection
	if err := db.Ping(); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}

	// Auto-create tables
	if err := createTables(); err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	log.Println("Database connected and tables ready")
	return nil
}

func createTables() error {
	queries := []string{
		`CREATE TABLE IF NOT EXISTS tagent_admin (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL,
			phone TEXT DEFAULT '',
			company TEXT NOT NULL,
			role TEXT NOT NULL,
			cluster_name TEXT DEFAULT '',
			created_at TIMESTAMP DEFAULT NOW()
		)`,
		`CREATE TABLE IF NOT EXISTS tagent_users (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL,
			email TEXT NOT NULL,
			phone TEXT DEFAULT '',
			role TEXT NOT NULL DEFAULT 'Viewer',
			permissions TEXT[] DEFAULT '{"view"}',
			token TEXT UNIQUE NOT NULL,
			created_at TIMESTAMP DEFAULT NOW(),
			last_access TIMESTAMP,
			created_by TEXT REFERENCES tagent_admin(id)
		)`,
		`CREATE TABLE IF NOT EXISTS tagent_audit_log (
			id SERIAL PRIMARY KEY,
			user_id TEXT,
			user_name TEXT,
			action TEXT NOT NULL,
			details TEXT,
			ip_address TEXT,
			created_at TIMESTAMP DEFAULT NOW()
		)`,
	}

	for _, q := range queries {
		if _, err := db.Exec(q); err != nil {
			return err
		}
	}
	return nil
}

// generateToken creates a secure random token for user access links
func generateToken() string {
	bytes := make([]byte, 16)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// ===== Admin Setup =====

type AdminSetupRequest struct {
	Name        string `json:"name" binding:"required"`
	Email       string `json:"email" binding:"required"`
	Phone       string `json:"phone"`
	Company     string `json:"company" binding:"required"`
	Role        string `json:"role" binding:"required"`
	ClusterName string `json:"cluster_name"`
}

// RegisterUserRoutes adds all user management endpoints
func RegisterUserRoutes(router *gin.Engine) {
	// Check if setup is complete
	router.GET("/api/v1/auth/status", func(c *gin.Context) {
		if db == nil {
			c.JSON(503, gin.H{"error": "database not connected", "setup_complete": false})
			return
		}
		var count int
		db.QueryRow("SELECT COUNT(*) FROM tagent_admin").Scan(&count)
		c.JSON(200, gin.H{"setup_complete": count > 0})
	})

	// Get admin info
	router.GET("/api/v1/auth/admin", func(c *gin.Context) {
		if db == nil {
			c.JSON(503, gin.H{"error": "database not connected"})
			return
		}
		var admin struct {
			ID          string `json:"id"`
			Name        string `json:"name"`
			Email       string `json:"email"`
			Phone       string `json:"phone"`
			Company     string `json:"company"`
			Role        string `json:"role"`
			ClusterName string `json:"cluster_name"`
		}
		err := db.QueryRow("SELECT id, name, email, phone, company, role, cluster_name FROM tagent_admin LIMIT 1").
			Scan(&admin.ID, &admin.Name, &admin.Email, &admin.Phone, &admin.Company, &admin.Role, &admin.ClusterName)
		if err != nil {
			c.JSON(404, gin.H{"error": "no admin configured"})
			return
		}
		c.JSON(200, admin)
	})

	// Setup admin (first time)
	router.POST("/api/v1/auth/setup", func(c *gin.Context) {
		if db == nil {
			c.JSON(503, gin.H{"error": "database not connected"})
			return
		}
		var req AdminSetupRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		// Check if admin already exists
		var count int
		db.QueryRow("SELECT COUNT(*) FROM tagent_admin").Scan(&count)
		if count > 0 {
			c.JSON(409, gin.H{"error": "admin already configured"})
			return
		}

		id := generateToken()
		_, err := db.Exec(
			"INSERT INTO tagent_admin (id, name, email, phone, company, role, cluster_name) VALUES ($1, $2, $3, $4, $5, $6, $7)",
			id, req.Name, req.Email, req.Phone, req.Company, req.Role, req.ClusterName,
		)
		if err != nil {
			c.JSON(500, gin.H{"error": "failed to save admin", "detail": err.Error()})
			return
		}

		log.Printf("AUDIT: Admin setup completed by %s (%s)", req.Name, req.Email)
		c.JSON(201, gin.H{"status": "created", "id": id, "message": "Admin setup complete"})
	})

	// ===== User Management =====

	// List all users
	router.GET("/api/v1/users", func(c *gin.Context) {
		if db == nil {
			c.JSON(503, gin.H{"error": "database not connected"})
			return
		}
		rows, err := db.Query("SELECT id, name, email, phone, role, permissions, token, created_at, last_access FROM tagent_users ORDER BY created_at DESC")
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var users []gin.H
		for rows.Next() {
			var id, name, email, phone, role, token string
			var permissions []string
			var createdAt time.Time
			var lastAccess *time.Time
			rows.Scan(&id, &name, &email, &phone, &role, &permissions, &token, &createdAt, &lastAccess)
			users = append(users, gin.H{
				"id": id, "name": name, "email": email, "phone": phone,
				"role": role, "permissions": permissions, "token": token,
				"created_at": createdAt, "last_access": lastAccess,
			})
		}
		if users == nil {
			users = []gin.H{}
		}
		c.JSON(200, gin.H{"users": users, "total": len(users)})
	})

	// Create user
	router.POST("/api/v1/users", func(c *gin.Context) {
		if db == nil {
			c.JSON(503, gin.H{"error": "database not connected"})
			return
		}
		var req struct {
			Name        string   `json:"name" binding:"required"`
			Email       string   `json:"email" binding:"required"`
			Phone       string   `json:"phone"`
			Role        string   `json:"role"`
			Permissions []string `json:"permissions"`
		}
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(400, gin.H{"error": err.Error()})
			return
		}

		id := generateToken()
		token := generateToken()
		if req.Role == "" {
			req.Role = "Viewer"
		}
		if req.Permissions == nil {
			req.Permissions = []string{"view"}
		}

		_, err := db.Exec(
			"INSERT INTO tagent_users (id, name, email, phone, role, permissions, token) VALUES ($1, $2, $3, $4, $5, $6, $7)",
			id, req.Name, req.Email, req.Phone, req.Role, req.Permissions, token,
		)
		if err != nil {
			c.JSON(500, gin.H{"error": "failed to create user", "detail": err.Error()})
			return
		}

		log.Printf("AUDIT: User created: %s (%s) with role %s", req.Name, req.Email, req.Role)
		c.JSON(201, gin.H{
			"status": "created", "id": id, "token": token,
			"access_link": fmt.Sprintf("/access/%s", token),
			"message":     fmt.Sprintf("User %s created successfully", req.Name),
		})
	})

	// Delete user
	router.DELETE("/api/v1/users/:id", func(c *gin.Context) {
		if db == nil {
			c.JSON(503, gin.H{"error": "database not connected"})
			return
		}
		id := c.Param("id")
		result, err := db.Exec("DELETE FROM tagent_users WHERE id = $1", id)
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		rows, _ := result.RowsAffected()
		if rows == 0 {
			c.JSON(404, gin.H{"error": "user not found"})
			return
		}
		log.Printf("AUDIT: User deleted: %s", id)
		c.JSON(200, gin.H{"status": "deleted", "id": id})
	})

	// Verify user token (for /access/[token] page)
	router.GET("/api/v1/auth/verify/:token", func(c *gin.Context) {
		if db == nil {
			c.JSON(503, gin.H{"error": "database not connected"})
			return
		}
		token := c.Param("token")
		var user struct {
			ID    string `json:"id"`
			Name  string `json:"name"`
			Email string `json:"email"`
			Role  string `json:"role"`
		}
		err := db.QueryRow("SELECT id, name, email, role FROM tagent_users WHERE token = $1", token).
			Scan(&user.ID, &user.Name, &user.Email, &user.Role)
		if err != nil {
			c.JSON(404, gin.H{"error": "invalid token", "valid": false})
			return
		}

		// Update last access time
		db.Exec("UPDATE tagent_users SET last_access = NOW() WHERE token = $1", token)

		// Get company from admin
		var company string
		db.QueryRow("SELECT company FROM tagent_admin LIMIT 1").Scan(&company)

		log.Printf("AUDIT: User %s (%s) accessed via token", user.Name, user.Email)
		c.JSON(200, gin.H{
			"valid":   true,
			"user":    user,
			"company": company,
		})
	})

	// Get audit log
	router.GET("/api/v1/auth/audit", func(c *gin.Context) {
		if db == nil {
			c.JSON(503, gin.H{"error": "database not connected"})
			return
		}
		rows, err := db.Query("SELECT user_name, action, details, created_at FROM tagent_audit_log ORDER BY created_at DESC LIMIT 50")
		if err != nil {
			c.JSON(500, gin.H{"error": err.Error()})
			return
		}
		defer rows.Close()

		var logs []gin.H
		for rows.Next() {
			var userName, action, details string
			var createdAt time.Time
			rows.Scan(&userName, &action, &details, &createdAt)
			logs = append(logs, gin.H{"user": userName, "action": action, "details": details, "time": createdAt})
		}
		c.JSON(200, gin.H{"logs": logs})
	})
}

// SendAccessEmail sends the unique link to the user via notification service
func SendAccessEmail(notificationURL, userName, userEmail, accessLink, company, adminName string) {
	// This would call the notification service to send the email
	// For now it's handled by the frontend calling /notify directly
	log.Printf("ACCESS_LINK: User=%s Email=%s Link=%s", userName, userEmail, accessLink)
}
