export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimitService {
  private limits: Map<string, RateLimitEntry> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  registerLimit(name: string, config: RateLimitConfig): void {
    this.configs.set(name, config);
  }

  async checkLimit(identifier: string, limitName = 'default'): Promise<RateLimitResult> {
    const config = this.configs.get(limitName);

    if (!config) {
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: new Date(),
      };
    }

    const now = Date.now();
    const entry = this.limits.get(identifier);

    if (!entry || entry.resetAt < now) {
      const resetAt = now + config.windowMs;
      this.limits.set(identifier, { count: 1, resetAt });

      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetAt: new Date(resetAt),
      };
    }

    if (entry.count >= config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date(entry.resetAt),
      };
    }

    entry.count++;
    this.limits.set(identifier, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: new Date(entry.resetAt),
    };
  }

  resetLimit(identifier: string): void {
    this.limits.delete(identifier);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetAt < now) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimitService = new RateLimitService();
