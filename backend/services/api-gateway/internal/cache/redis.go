// Package cache provides Redis-backed caching, rate limiting, and session management.
package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/redis/go-redis/v9"
)

var client *redis.Client

// Init connects to Redis. If REDIS_URL is not set, caching is disabled.
func Init() bool {
	url := os.Getenv("REDIS_URL")
	if url == "" {
		url = "redis://localhost:6379"
	}

	opts, err := redis.ParseURL(url)
	if err != nil {
		log.Printf("[redis] Invalid REDIS_URL: %v — caching disabled", err)
		return false
	}

	client = redis.NewClient(opts)

	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Printf("[redis] Connection failed: %v — caching disabled", err)
		client = nil
		return false
	}

	log.Printf("[redis] Connected successfully")
	return true
}

// IsConnected returns true if Redis is available
func IsConnected() bool {
	return client != nil
}

// Client returns the raw Redis client for advanced usage
func Client() *redis.Client {
	return client
}

// ===== Generic Cache Operations =====

// Set stores a value with expiration
func Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	if client == nil {
		return nil
	}
	data, err := json.Marshal(value)
	if err != nil {
		return err
	}
	return client.Set(ctx, key, data, ttl).Err()
}

// Get retrieves a cached value. Returns false if not found.
func Get(ctx context.Context, key string, dest interface{}) bool {
	if client == nil {
		return false
	}
	data, err := client.Get(ctx, key).Bytes()
	if err != nil {
		return false
	}
	return json.Unmarshal(data, dest) == nil
}

// Delete removes a cached key
func Delete(ctx context.Context, key string) {
	if client == nil {
		return
	}
	client.Del(ctx, key)
}

// Invalidate removes all keys matching a pattern
func Invalidate(ctx context.Context, pattern string) {
	if client == nil {
		return
	}
	keys, _ := client.Keys(ctx, pattern).Result()
	if len(keys) > 0 {
		client.Del(ctx, keys...)
	}
}

// ===== Rate Limiting =====

// RateLimitResult contains the result of a rate limit check
type RateLimitResult struct {
	Allowed    bool
	Remaining  int
	ResetAfter time.Duration
}

// CheckRateLimit implements sliding window rate limiting.
// key: unique identifier (IP, user ID, API key)
// limit: max requests allowed
// window: time window duration
func CheckRateLimit(ctx context.Context, key string, limit int, window time.Duration) RateLimitResult {
	if client == nil {
		return RateLimitResult{Allowed: true, Remaining: limit}
	}

	now := time.Now()
	windowStart := now.Add(-window)
	redisKey := fmt.Sprintf("ratelimit:%s", key)

	pipe := client.Pipeline()

	// Remove entries outside the window
	pipe.ZRemRangeByScore(ctx, redisKey, "0", fmt.Sprintf("%d", windowStart.UnixNano()))

	// Count entries in the window
	countCmd := pipe.ZCard(ctx, redisKey)

	// Add current request
	pipe.ZAdd(ctx, redisKey, redis.Z{Score: float64(now.UnixNano()), Member: now.UnixNano()})

	// Set TTL on the key
	pipe.Expire(ctx, redisKey, window)

	_, err := pipe.Exec(ctx)
	if err != nil {
		// If Redis fails, allow the request
		return RateLimitResult{Allowed: true, Remaining: limit}
	}

	count := int(countCmd.Val())
	allowed := count < limit
	remaining := limit - count - 1
	if remaining < 0 {
		remaining = 0
	}

	return RateLimitResult{
		Allowed:    allowed,
		Remaining:  remaining,
		ResetAfter: window - time.Since(now),
	}
}

// ===== Session Management =====

// Session represents a user session
type Session struct {
	UserID    string    `json:"user_id"`
	UserName  string    `json:"user_name"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	IsAdmin   bool      `json:"is_admin"`
	CreatedAt time.Time `json:"created_at"`
	ExpiresAt time.Time `json:"expires_at"`
	IPAddress string    `json:"ip_address"`
}

const sessionPrefix = "session:"
const sessionTTL = 24 * time.Hour

// CreateSession stores a new session and returns the session ID
func CreateSession(ctx context.Context, session Session) (string, error) {
	if client == nil {
		return "", fmt.Errorf("redis not connected")
	}

	sessionID := fmt.Sprintf("%d", time.Now().UnixNano())
	session.CreatedAt = time.Now().UTC()
	session.ExpiresAt = time.Now().UTC().Add(sessionTTL)

	data, err := json.Marshal(session)
	if err != nil {
		return "", err
	}

	err = client.Set(ctx, sessionPrefix+sessionID, data, sessionTTL).Err()
	if err != nil {
		return "", err
	}

	return sessionID, nil
}

// GetSession retrieves a session by ID
func GetSession(ctx context.Context, sessionID string) (*Session, error) {
	if client == nil {
		return nil, fmt.Errorf("redis not connected")
	}

	data, err := client.Get(ctx, sessionPrefix+sessionID).Bytes()
	if err != nil {
		return nil, err
	}

	var session Session
	if err := json.Unmarshal(data, &session); err != nil {
		return nil, err
	}

	if time.Now().After(session.ExpiresAt) {
		client.Del(ctx, sessionPrefix+sessionID)
		return nil, fmt.Errorf("session expired")
	}

	return &session, nil
}

// DeleteSession removes a session
func DeleteSession(ctx context.Context, sessionID string) {
	if client == nil {
		return
	}
	client.Del(ctx, sessionPrefix+sessionID)
}

// RefreshSession extends a session's TTL
func RefreshSession(ctx context.Context, sessionID string) {
	if client == nil {
		return
	}
	client.Expire(ctx, sessionPrefix+sessionID, sessionTTL)
}

// GetActiveSessions returns count of active sessions
func GetActiveSessions(ctx context.Context) int {
	if client == nil {
		return 0
	}
	keys, _ := client.Keys(ctx, sessionPrefix+"*").Result()
	return len(keys)
}

// ===== Response Cache Helpers =====

// CacheKey generates a cache key from method + path + query
func CacheKey(prefix, path, query string) string {
	if query != "" {
		return fmt.Sprintf("cache:%s:%s?%s", prefix, path, query)
	}
	return fmt.Sprintf("cache:%s:%s", prefix, path)
}

// GetCachedResponse retrieves a cached API response
func GetCachedResponse(ctx context.Context, key string) ([]byte, bool) {
	if client == nil {
		return nil, false
	}
	data, err := client.Get(ctx, key).Bytes()
	if err != nil {
		return nil, false
	}
	return data, true
}

// SetCachedResponse stores an API response with TTL
func SetCachedResponse(ctx context.Context, key string, data []byte, ttl time.Duration) {
	if client == nil {
		return
	}
	client.Set(ctx, key, data, ttl)
}

// ===== Stats =====

// Stats returns Redis usage statistics
func Stats(ctx context.Context) map[string]interface{} {
	if client == nil {
		return map[string]interface{}{"connected": false}
	}

	info, _ := client.Info(ctx, "memory", "clients", "keyspace").Result()
	dbSize, _ := client.DBSize(ctx).Result()

	return map[string]interface{}{
		"connected":       true,
		"total_keys":      dbSize,
		"active_sessions": GetActiveSessions(ctx),
		"info_snippet":    info[:min(200, len(info))],
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
