// Performance Optimization - Caching Layer
// In-memory cache for frequently accessed data to reduce database queries

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  invalidations: number;
  hitRatio: number; // Percentage (0-100)
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default
  private readonly isDevelopment = process.env.NODE_ENV !== 'production';
  
  // Metrics tracking
  private metrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    invalidations: 0
  };

  /**
   * Log only in development environment
   */
  private log(message: string): void {
    if (this.isDevelopment) {
      console.log(message);
    }
  }

  /**
   * Get cached data if valid, otherwise return null
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.metrics.misses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.metrics.misses++;
      return null;
    }

    this.metrics.hits++;
    this.log(`🎯 Cache HIT: ${key}`);
    return entry.data as T;
  }

  /**
   * Set cached data with optional TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
    this.metrics.sets++;
    this.log(`💾 Cache SET: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.metrics.invalidations++;
      this.log(`🗑️  Cache INVALIDATE: ${key}`);
    }
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    let count = 0;
    for (const key of Array.from(this.cache.keys())) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
        count++;
      }
    }
    if (count > 0) {
      this.metrics.invalidations += count;
      this.log(`🗑️  Cache INVALIDATE PATTERN: ${pattern} (${count} entries)`);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    this.log(`🗑️  Cache CLEAR: All ${size} entries removed`);
  }

  /**
   * Get cache statistics with hit/miss ratios
   */
  getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.entries());
    
    const valid = entries.filter(([_, entry]) => 
      now - entry.timestamp <= entry.ttl
    ).length;
    
    const expired = entries.length - valid;

    return {
      total: entries.length,
      valid,
      expired,
      size: this.cache.size
    };
  }

  /**
   * Get cache performance metrics including hit/miss ratios
   */
  getMetrics(): CacheMetrics {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRatio = total > 0 ? (this.metrics.hits / total) * 100 : 0;

    return {
      hits: this.metrics.hits,
      misses: this.metrics.misses,
      sets: this.metrics.sets,
      invalidations: this.metrics.invalidations,
      hitRatio: Math.round(hitRatio * 100) / 100 // Round to 2 decimal places
    };
  }

  /**
   * Reset metrics (useful for testing or periodic resets)
   */
  resetMetrics(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0
    };
  }

  /**
   * Clean up expired entries (run periodically)
   */
  cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.log(`🧹 Cache CLEANUP: Removed ${cleaned} expired entries`);
    }
  }

  /**
   * Helper: Generate cache key for user settings
   */
  static userSettingsKey(userId: string): string {
    return `user_settings:${userId}`;
  }

  /**
   * Helper: Generate cache key for user tier
   */
  static userTierKey(userId: string): string {
    return `user_tier:${userId}`;
  }

  /**
   * Helper: Generate cache key for conversation messages
   */
  static conversationMessagesKey(conversationId: string): string {
    return `conversation_messages:${conversationId}`;
  }

  /**
   * Helper: Generate cache key for user memories
   */
  static userMemoriesKey(userId: string, category?: string): string {
    return category 
      ? `user_memories:${userId}:${category}`
      : `user_memories:${userId}`;
  }

  /**
   * Helper: Generate cache key for analytics events
   */
  static analyticsEventsKey(userId: string, timeframe?: string): string {
    return timeframe 
      ? `analytics_events:${userId}:${timeframe}`
      : `analytics_events:${userId}`;
  }

  /**
   * Helper: Generate cache key for analytics summary
   */
  static analyticsSummaryKey(userId: string): string {
    return `analytics_summary:${userId}`;
  }
}

// Export class and singleton instance
export { CacheService };
export const cache = new CacheService();

// Run cleanup every 10 minutes
setInterval(() => cache.cleanup(), 10 * 60 * 1000);
