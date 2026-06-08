// Package metrics provides Prometheus instrumentation for the API Gateway.
//
// Exposes /metrics endpoint with:
// - HTTP request count (by method, path, status)
// - HTTP request duration histogram
// - Active WebSocket connections
// - Upstream service health (1=up, 0=down)
// - Rate limit hits
// - Cache hit/miss ratio
// - Go runtime metrics (goroutines, memory, GC)
package metrics

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	// HTTP metrics
	httpRequestsTotal = promauto.NewCounterVec(prometheus.CounterOpts{
		Namespace: "tagent",
		Subsystem: "gateway",
		Name:      "http_requests_total",
		Help:      "Total HTTP requests processed",
	}, []string{"method", "path", "status"})

	httpRequestDuration = promauto.NewHistogramVec(prometheus.HistogramOpts{
		Namespace: "tagent",
		Subsystem: "gateway",
		Name:      "http_request_duration_seconds",
		Help:      "HTTP request duration in seconds",
		Buckets:   prometheus.DefBuckets,
	}, []string{"method", "path"})

	httpRequestsInFlight = promauto.NewGauge(prometheus.GaugeOpts{
		Namespace: "tagent",
		Subsystem: "gateway",
		Name:      "http_requests_in_flight",
		Help:      "Current number of HTTP requests being processed",
	})

	// WebSocket metrics
	WebSocketClients = promauto.NewGauge(prometheus.GaugeOpts{
		Namespace: "tagent",
		Subsystem: "gateway",
		Name:      "websocket_clients",
		Help:      "Number of active WebSocket connections",
	})

	// Upstream health
	UpstreamHealth = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Namespace: "tagent",
		Subsystem: "gateway",
		Name:      "upstream_health",
		Help:      "Upstream service health (1=up, 0=down)",
	}, []string{"service"})

	// Rate limiting
	RateLimitHits = promauto.NewCounter(prometheus.CounterOpts{
		Namespace: "tagent",
		Subsystem: "gateway",
		Name:      "rate_limit_hits_total",
		Help:      "Total number of rate-limited requests",
	})

	// Cache
	CacheHits = promauto.NewCounter(prometheus.CounterOpts{
		Namespace: "tagent",
		Subsystem: "gateway",
		Name:      "cache_hits_total",
		Help:      "Total cache hits",
	})

	CacheMisses = promauto.NewCounter(prometheus.CounterOpts{
		Namespace: "tagent",
		Subsystem: "gateway",
		Name:      "cache_misses_total",
		Help:      "Total cache misses",
	})
)

// Middleware returns a Gin middleware that records HTTP metrics
func Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		path := c.FullPath()
		if path == "" {
			path = c.Request.URL.Path
		}
		method := c.Request.Method

		httpRequestsInFlight.Inc()
		c.Next()
		httpRequestsInFlight.Dec()

		status := strconv.Itoa(c.Writer.Status())
		duration := time.Since(start).Seconds()

		httpRequestsTotal.WithLabelValues(method, path, status).Inc()
		httpRequestDuration.WithLabelValues(method, path).Observe(duration)
	}
}

// Handler returns the Prometheus metrics HTTP handler for /metrics endpoint
func Handler() gin.HandlerFunc {
	h := promhttp.Handler()
	return func(c *gin.Context) {
		h.ServeHTTP(c.Writer, c.Request)
	}
}

// RecordRateLimit increments rate limit counter
func RecordRateLimit() {
	RateLimitHits.Inc()
}

// RecordCacheHit increments cache hit counter
func RecordCacheHit() {
	CacheHits.Inc()
}

// RecordCacheMiss increments cache miss counter
func RecordCacheMiss() {
	CacheMisses.Inc()
}
