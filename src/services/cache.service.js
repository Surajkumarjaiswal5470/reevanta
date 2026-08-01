/**
 * Cache-Aside Service
 * ──────────────────────────────────────────────────────────
 * Provides high-level Redis operations (get, set, delete, invalidation)
 * with explicit TTL strategies and structured logging.
 */

const redisClient = require('../config/redis');
const cacheKeys = require('../utils/cacheKeys');

/**
 * Standard TTL Constants (in seconds)
 */
const TTL = {
  HOMEPAGE: 5 * 60,       // 5 minutes (300s)
  FEATURED: 10 * 60,      // 10 minutes (600s)
  CATEGORIES: 24 * 3600,  // 24 hours (86400s)
  LISTING: 30 * 60,       // 30 minutes (1800s)
  SEARCH: 2 * 60,         // 2 minutes (120s)
  NEARBY: 2 * 60,         // 2 minutes (120s)
  DEFAULT: 5 * 60,        // 5 minutes fallback
};

class CacheService {
  /**
   * Retrieve parsed JSON item from Redis
   * @param {string} key
   * @returns {Promise<any|null>}
   */
  async get(key) {
    try {
      if (!redisClient.isOpen) return null;
      const data = await redisClient.get(key);
      if (data) {
        console.log(`[Cache Hit] Key: ${key}`);
        return JSON.parse(data);
      }
      console.log(`[Cache Miss] Key: ${key}`);
      return null;
    } catch (err) {
      console.error(`[Cache Error] Failed GET for key "${key}":`, err.message);
      return null; // Non-blocking fallback
    }
  }

  /**
   * Store data in Redis with TTL expiration
   * @param {string} key
   * @param {any} value
   * @param {number} ttlSeconds
   */
  async set(key, value, ttlSeconds = TTL.DEFAULT) {
    try {
      if (!redisClient.isOpen) return;
      const payload = JSON.stringify(value);
      await redisClient.set(key, payload, { EX: ttlSeconds });
      console.log(`[Cache Write] Key: ${key} | TTL: ${ttlSeconds}s`);
    } catch (err) {
      console.error(`[Cache Error] Failed SET for key "${key}":`, err.message);
    }
  }

  /**
   * Delete a specific key from Redis
   * @param {string} key
   */
  async delete(key) {
    try {
      if (!redisClient.isOpen) return;
      await redisClient.del(key);
      console.log(`[Cache Delete] Key: ${key}`);
    } catch (err) {
      console.error(`[Cache Error] Failed DELETE for key "${key}":`, err.message);
    }
  }

  /**
   * Invalidate all relevant caches when a listing is created, updated, or deleted.
   * Purges: listing:{id}, homepage cache, and featured cache.
   * Search & Nearby caches expire naturally via TTL (2 mins).
   * @param {string|number} listingId
   */
  async invalidateListingCaches(listingId) {
    try {
      if (!redisClient.isOpen) return;
      const listingKey = cacheKeys.listing(listingId);
      const homeKey = cacheKeys.home();
      const featuredKey = cacheKeys.featured();

      await Promise.all([
        redisClient.del(listingKey),
        redisClient.del(homeKey),
        redisClient.del(featuredKey),
      ]);

      console.log(`[Cache Invalidation] Automatically purged listing cache ("${listingKey}"), home cache ("${homeKey}"), and featured cache ("${featuredKey}")`);
    } catch (err) {
      console.error(`[Cache Error] Invalidation failed for listing "${listingId}":`, err.message);
    }
  }

  /**
   * Helper TTL constants export
   */
  get TTL() {
    return TTL;
  }
}

module.exports = new CacheService();
