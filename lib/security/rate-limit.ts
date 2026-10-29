/**
 * Sliding-window-ish token bucket rate limiter.
 *
 * This is an application-layer abuse control, NOT DDoS protection: it runs per
 * server instance and only after a request has already reached the app. Volumetric
 * attacks must be absorbed at the edge (Cloudflare or equivalent — see guides/DEPLOYMENT.md).
 * For multi-instance deployments, implement `RateLimitStore` on Redis/Upstash.
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Seconds until a token is available again (0 if allowed). */
  retryAfter: number;
  limit: number;
}

export interface RateLimitStore {
  take(key: string, capacity: number, refillPerSecond: number, now: number): RateLimitResult;
}

interface Bucket {
  tokens: number;
  updated: number;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private buckets = new Map<string, Bucket>();

  constructor(private readonly maxKeys = 20_000) {}

  take(key: string, capacity: number, refillPerSecond: number, now: number): RateLimitResult {
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = { tokens: capacity, updated: now };
    } else {
      const elapsed = Math.max(0, now - bucket.updated) / 1000;
      bucket.tokens = Math.min(capacity, bucket.tokens + elapsed * refillPerSecond);
      bucket.updated = now;
      this.buckets.delete(key); // keep insertion order ≈ recency for eviction
    }

    let allowed = false;
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      allowed = true;
    }
    this.buckets.set(key, bucket);
    this.evict();

    const retryAfter = allowed ? 0 : Math.ceil((1 - bucket.tokens) / refillPerSecond);
    return { allowed, remaining: Math.floor(bucket.tokens), retryAfter, limit: capacity };
  }

  private evict() {
    while (this.buckets.size > this.maxKeys) {
      const oldest = this.buckets.keys().next().value;
      if (oldest === undefined) break;
      this.buckets.delete(oldest);
    }
  }
}

export interface LimitPolicy {
  /** Burst size. */
  capacity: number;
  /** Requests allowed per minute at steady state. */
  perMinute: number;
}

export class RateLimiter {
  constructor(
    private readonly store: RateLimitStore = new MemoryRateLimitStore(),
    private readonly now: () => number = Date.now,
  ) {}

  check(key: string, policy: LimitPolicy): RateLimitResult {
    return this.store.take(key, policy.capacity, policy.perMinute / 60, this.now());
  }
}

/** Policies for each endpoint family. Tune per deployment. */
export const POLICIES = {
  /** Local library search — cheap, but still bounded per client. */
  librarySearch: { capacity: 30, perMinute: 60 },
  /** Live YouTube search costs API quota (100 units per call). */
  liveSearch: { capacity: 5, perMinute: 10 },
  /** Backstop across all clients on this instance. */
  globalSearch: { capacity: 300, perMinute: 1200 },
  globalLive: { capacity: 20, perMinute: 60 },
} satisfies Record<string, LimitPolicy>;

// One limiter per server instance.
export const rateLimiter = new RateLimiter();
