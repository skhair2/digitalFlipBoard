// Client-side rate limiting for WebSocket messages
class RateLimiter {
    constructor(maxRequests = 10, timeWindow = 60000) {
        this.maxRequests = maxRequests
        this.timeWindow = timeWindow
        this.requests = []
    }

    canMakeRequest() {
        const now = Date.now()
        // Remove requests outside time window
        this.requests = this.requests.filter(time => now - time < this.timeWindow)

        if (this.requests.length >= this.maxRequests) {
            return false
        }

        this.requests.push(now)
        return true
    }

    getRemainingRequests() {
        const now = Date.now()
        this.requests = this.requests.filter(time => now - time < this.timeWindow)
        return this.maxRequests - this.requests.length
    }

    getTimeUntilReset() {
        if (this.requests.length === 0) return 0
        const oldestRequest = Math.min(...this.requests)
        return Math.max(0, this.timeWindow - (Date.now() - oldestRequest))
    }
}

export const messageRateLimiter = new RateLimiter(10, 60000) // 10 messages per minute
export const sessionRateLimiter = new RateLimiter(3, 300000) // 3 session creations per 5 min
