package middleware

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/tagent-ai/tagent/backend/services/api-gateway/internal/cache"
)

// RateLimitConfig holds rate limiter configuration
type RateLimitConfig struct {
	RequestsPerMinute int           // max requests per IP per minute
	BurstSize         int           // max burst (short window)
	BurstWindow       time.Duration // burst window duration
}

// DefaultRateLimitConfig returns sensible defaults
func DefaultRateLimitConfig() RateLimitConfig {
	return RateLimitConfig{
		RequestsPerMinute: 120,          // 120 req/min per IP
		BurstSize:         30,           // 30 req per 5 seconds
		BurstWindow:       5 * time.Second,
	}
}

// RateLimit returns a Gin middleware that enforces rate limiting via Redis.
// If Redis is not connected, all requests are allowed (graceful degradation).
func RateLimit(cfg RateLimitConfig) gin.HandlerFunc {
	return func(c *gin.Context) {
		if !cache.IsConnected() {
			c.Next()
			return
		}

		// Use client IP as the rate limit key
		ip := c.ClientIP()
		key := fmt.Sprintf("ip:%s", ip)

		// Check minute-level rate limit
		result := cache.CheckRateLimit(c.Request.Context(), key, cfg.RequestsPerMinute, time.Minute)

		// Set rate limit headers
		c.Header("X-RateLimit-Limit", fmt.Sprintf("%d", cfg.RequestsPerMinute))
		c.Header("X-RateLimit-Remaining", fmt.Sprintf("%d", result.Remaining))
		c.Header("X-RateLimit-Reset", fmt.Sprintf("%d", time.Now().Add(result.ResetAfter).Unix()))

		if !result.Allowed {
			c.Header("Retry-After", fmt.Sprintf("%d", int(result.ResetAfter.Seconds())+1))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "rate limit exceeded",
				"limit":       cfg.RequestsPerMinute,
				"retry_after": fmt.Sprintf("%ds", int(result.ResetAfter.Seconds())+1),
			})
			return
		}

		// Also check burst limit (shorter window)
		burstKey := fmt.Sprintf("burst:%s", ip)
		burstResult := cache.CheckRateLimit(c.Request.Context(), burstKey, cfg.BurstSize, cfg.BurstWindow)
		if !burstResult.Allowed {
			c.Header("Retry-After", fmt.Sprintf("%d", int(burstResult.ResetAfter.Seconds())+1))
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"error":       "burst rate limit exceeded",
				"limit":       cfg.BurstSize,
				"window":      cfg.BurstWindow.String(),
				"retry_after": fmt.Sprintf("%ds", int(burstResult.ResetAfter.Seconds())+1),
			})
			return
		}

		c.Next()
	}
}
