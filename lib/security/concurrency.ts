/**
 * Bounded concurrency for expensive upstream work. When the queue is full,
 * callers fail fast instead of piling up requests (load shedding).
 */
export class Semaphore {
  private active = 0;
  private queue: Array<() => void> = [];

  constructor(
    private readonly maxConcurrent: number,
    private readonly maxQueue: number,
  ) {}

  async run<T>(task: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrent) {
      if (this.queue.length >= this.maxQueue) throw new OverloadedError();
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active += 1;
    try {
      return await task();
    } finally {
      this.active -= 1;
      this.queue.shift()?.();
    }
  }

  get pending(): number {
    return this.queue.length;
  }
}

export class OverloadedError extends Error {
  constructor() {
    super("Server is busy");
    this.name = "OverloadedError";
  }
}

/** Upstream API calls (YouTube) share one small pool per instance. */
export const upstreamPool = new Semaphore(4, 16);
