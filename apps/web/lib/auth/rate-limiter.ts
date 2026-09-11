interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limiting store with sliding/fixed window
const ipAttempts = new Map<string, RateLimitEntry>();

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of ipAttempts.entries()) {
    if (now > entry.resetTime) {
      ipAttempts.delete(ip);
    }
  }
}, 60 * 1000); // Cleanup every minute

/**
 * Checks if an IP has exceeded the login rate limit
 * @param ip Client IP address
 * @param maxAttempts Maximum allowed attempts (default: 5)
 * @param windowMs Time window in milliseconds (default: 10 minutes = 600,000 ms)
 * @returns { isAllowed: boolean, remaining: number, retryAfterSeconds: number }
 */
export function checkLoginRateLimit(
  ip: string, 
  maxAttempts = 5, 
  windowMs = 10 * 60 * 1000
): { isAllowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const entry = ipAttempts.get(ip);

  if (!entry || now > entry.resetTime) {
    ipAttempts.set(ip, {
      count: 1,
      resetTime: now + windowMs
    });
    return {
      isAllowed: true,
      remaining: maxAttempts - 1,
      retryAfterSeconds: Math.ceil(windowMs / 1000)
    };
  }

  if (entry.count >= maxAttempts) {
    const retryAfterSeconds = Math.ceil((entry.resetTime - now) / 1000);
    return {
      isAllowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, retryAfterSeconds)
    };
  }

  entry.count += 1;
  return {
    isAllowed: true,
    remaining: maxAttempts - entry.count,
    retryAfterSeconds: Math.ceil((entry.resetTime - now) / 1000)
  };
}

/**
 * Resets rate limit for an IP on successful login
 */
export function resetLoginRateLimit(ip: string): void {
  ipAttempts.delete(ip);
}
