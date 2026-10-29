/**
 * Small in-memory TTL + LRU cache for server-side responses (API results,
 * hydrated metadata). Per-instance only — put a CDN/edge cache in front for
 * cross-instance caching (see guides/DEPLOYMENT.md).
 */
export class TtlCache<V> {
  private store = new Map<string, { value: V; expires: number }>();

  constructor(
    private readonly maxEntries: number,
    private readonly ttlMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  get(key: string): V | undefined {
    const hit = this.store.get(key);
    if (!hit) return undefined;
    if (hit.expires <= this.now()) {
      this.store.delete(key);
      return undefined;
    }
    // Refresh LRU position.
    this.store.delete(key);
    this.store.set(key, hit);
    return hit.value;
  }

  set(key: string, value: V, ttlMs = this.ttlMs): void {
    if (this.store.has(key)) this.store.delete(key);
    this.store.set(key, { value, expires: this.now() + ttlMs });
    while (this.store.size > this.maxEntries) {
      const oldest = this.store.keys().next().value;
      if (oldest === undefined) break;
      this.store.delete(oldest);
    }
  }

  get size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}

/**
 * Coalesce concurrent identical requests so a burst of the same query only
 * triggers one upstream call.
 */
export class InFlight<V> {
  private pending = new Map<string, Promise<V>>();

  run(key: string, task: () => Promise<V>): Promise<V> {
    const existing = this.pending.get(key);
    if (existing) return existing;
    const promise = task().finally(() => this.pending.delete(key));
    this.pending.set(key, promise);
    return promise;
  }
}
