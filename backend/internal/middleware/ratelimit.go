package middleware

import (
	"net/http"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type RateLimiter struct {
	requests map[string][]time.Time
	mu       sync.RWMutex
	limit    int
	window   time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		requests: make(map[string][]time.Time),
		limit:    limit,
		window:   window,
	}
	// Cleanup old entries every minute
	go rl.cleanup()
	return rl
}

func (rl *RateLimiter) cleanup() {
	ticker := time.NewTicker(time.Minute)
	for range ticker.C {
		rl.mu.Lock()
		now := time.Now()
		for key, times := range rl.requests {
			var valid []time.Time
			for _, t := range times {
				if now.Sub(t) < rl.window {
					valid = append(valid, t)
				}
			}
			if len(valid) == 0 {
				delete(rl.requests, key)
			} else {
				rl.requests[key] = valid
			}
		}
		rl.mu.Unlock()
	}
}

func (rl *RateLimiter) IsAllowed(key string) bool {
	rl.mu.Lock()
	defer rl.mu.Unlock()

	now := time.Now()
	times := rl.requests[key]
	
	// Filter out old requests
	var valid []time.Time
	for _, t := range times {
		if now.Sub(t) < rl.window {
			valid = append(valid, t)
		}
	}
	
	if len(valid) >= rl.limit {
		rl.requests[key] = valid
		return false
	}
	
	valid = append(valid, now)
	rl.requests[key] = valid
	return true
}

// Global rate limiters
var (
	// 100 requests per minute for general API
	GeneralLimiter = NewRateLimiter(100, time.Minute)
	// 10 score submissions per minute
	ScoreLimiter = NewRateLimiter(10, time.Minute)
	// 5 login attempts per minute
	AuthLimiter = NewRateLimiter(5, time.Minute)
)

func RateLimitMiddleware(limiter *RateLimiter) gin.HandlerFunc {
	return func(c *gin.Context) {
		key := c.ClientIP()
		
		if !limiter.IsAllowed(key) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded. Please try again later.",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

func GeneralRateLimit() gin.HandlerFunc {
	return RateLimitMiddleware(GeneralLimiter)
}

func ScoreRateLimit() gin.HandlerFunc {
	return RateLimitMiddleware(ScoreLimiter)
}

func AuthRateLimit() gin.HandlerFunc {
	return RateLimitMiddleware(AuthLimiter)
}
