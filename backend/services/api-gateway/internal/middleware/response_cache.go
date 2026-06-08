package middleware

import (
	"bytes"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tagent-ai/tagent/backend/services/api-gateway/internal/cache"
)

// CacheConfig holds caching configuration
type CacheConfig struct {
	TTL             time.Duration // how long to cache responses
	CacheableStatus []int        // HTTP status codes to cache (default: 200)
}

// DefaultCacheConfig returns sensible defaults (15 second TTL for real-time data)
func DefaultCacheConfig() CacheConfig {
	return CacheConfig{
		TTL:             15 * time.Second,
		CacheableStatus: []int{200},
	}
}

// responseWriter wraps gin.ResponseWriter to capture the response body
type responseWriter struct {
	gin.ResponseWriter
	body       *bytes.Buffer
	statusCode int
}

func (w *responseWriter) Write(b []byte) (int, error) {
	w.body.Write(b)
	return w.ResponseWriter.Write(b)
}

func (w *responseWriter) WriteHeader(statusCode int) {
	w.statusCode = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

// ResponseCache caches GET responses in Redis.
// Cache is bypassed for non-GET methods and when Redis is offline.
// Cache key = path + query string.
func ResponseCache(cfg CacheConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only cache GET requests
		if c.Request.Method != http.MethodGet {
			c.Next()
			return
		}

		// Skip if Redis not connected
		if !cache.IsConnected() {
			c.Next()
			return
		}

		// Skip if client sends Cache-Control: no-cache
		if c.GetHeader("Cache-Control") == "no-cache" {
			c.Next()
			return
		}

		// Generate cache key
		key := cache.CacheKey("resp", c.Request.URL.Path, c.Request.URL.RawQuery)

		// Try to get from cache
		if data, ok := cache.GetCachedResponse(c.Request.Context(), key); ok {
			c.Header("X-Cache", "HIT")
			c.Header("Content-Type", "application/json")
			c.Writer.WriteHeader(http.StatusOK)
			c.Writer.Write(data)
			c.Abort()
			return
		}

		// Cache MISS — execute the request and capture response
		c.Header("X-Cache", "MISS")

		writer := &responseWriter{
			ResponseWriter: c.Writer,
			body:           bytes.NewBuffer(nil),
			statusCode:     200,
		}
		c.Writer = writer

		c.Next()

		// After request: store in cache if status is cacheable
		if isCacheable(writer.statusCode, cfg.CacheableStatus) && writer.body.Len() > 0 {
			cache.SetCachedResponse(c.Request.Context(), key, writer.body.Bytes(), cfg.TTL)
		}
	}
}

func isCacheable(status int, allowed []int) bool {
	for _, s := range allowed {
		if status == s {
			return true
		}
	}
	return false
}
