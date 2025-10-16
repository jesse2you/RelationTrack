// Performance Optimization - Caching Layer
// In-memory cache for frequently accessed data to reduce database queries

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheService {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default

  /**
   * Get cached data if valid, otherwise return null
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    console.log(`🎯 Cache HIT: ${key}`);
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
    console.log(`💾 Cache SET: ${key} (TTL: ${ttl}ms)`);
  }

  /**
   * Invalidate specific cache entry
   */
  invalidate(key: string): void {
    const deleted = this.cache.delete(key);
    if (deleted) {
      console.log(`🗑️  Cache INVALIDATE: ${key}`);
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
      console.log(`🗑️  Cache INVALIDATE PATTERN: ${pattern} (${count} entries)`);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    console.log(`🗑️  Cache CLEAR: All ${size} entries removed`);
  }

  /**
   * Get cache statistics
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
      console.log(`🧹 Cache CLEANUP: Removed ${cleaned} expired entries`);
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
}

// Export class and singleton instance
export { CacheService };
export const cache = new CacheService();

// Run cleanup every 10 minutes
setInterval(() => cache.cleanup(), 10 * 60 * 1000);
