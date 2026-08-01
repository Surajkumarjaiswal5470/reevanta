/**
 * Redis Cache-Aside Express Middleware
 * ──────────────────────────────────────────────────────────
 * Checks Redis cache on GET requests before hitting MongoDB.
 * Excludes sensitive/write operations (auth, payment, chat, admin, profile).
 * Falls back gracefully to MongoDB if Redis is offline.
 */

const cacheService = require('../services/cache.service');
const cacheKeys = require('../utils/cacheKeys');

/**
 * List of path prefixes that MUST NEVER be cached.
 */
const EXCLUDED_PATH_PREFIXES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify-otp',
  '/api/auth/send-otp',
  '/api/payments',
  '/api/chat',
  '/api/users/profile',
  '/api/admin',
];

/**
 * Resolve cache key & TTL configuration based on request path & query.
 */
function resolveCacheConfig(req) {
  const path = req.path.toLowerCase();

  if (path === '/' || path === '/api/home') {
    return { key: cacheKeys.home(), ttl: cacheService.TTL.HOMEPAGE };
  }
  if (path.includes('/featured') || path.includes('/trending')) {
    return { key: cacheKeys.featured(), ttl: cacheService.TTL.FEATURED };
  }
  if (path.includes('/categories')) {
    return { key: cacheKeys.categories(), ttl: cacheService.TTL.CATEGORIES };
  }
  if (path.includes('/search')) {
    const q = req.query.q || req.query.query || '';
    const page = req.query.page || 1;
    return { key: cacheKeys.search(q, page, req.query), ttl: cacheService.TTL.SEARCH };
  }
  if (path.includes('/nearby')) {
    const { lat = 0, lng = 0, radius = 10 } = req.query;
    return { key: cacheKeys.nearby(lat, lng, radius), ttl: cacheService.TTL.NEARBY };
  }
  if (path.match(/\/listings?\/([a-zA-Z0-9_-]+)/)) {
    const match = path.match(/\/listings?\/([a-zA-Z0-9_-]+)/);
    const listingId = match[1];
    return { key: cacheKeys.listing(listingId), ttl: cacheService.TTL.LISTING };
  }

  // Generic read fallback for unspecified GET paths
  const routeKey = `route:${req.originalUrl || req.url}`;
  return { key: routeKey, ttl: cacheService.TTL.DEFAULT };
}

/**
 * Express Middleware for Redis Caching
 */

function cacheMiddleware(options = {}) {
  return async (req, res, next) => {
    // Rule 1: Only cache GET (read) operations
    if (req.method !== 'GET') {
      return next();
    }

    // Rule 2: Explicitly bypass excluded routes (login, register, OTP, payments, chat, profile, admin)
    const currentPath = req.path.toLowerCase();
    const isExcluded = EXCLUDED_PATH_PREFIXES.some((prefix) => currentPath.startsWith(prefix));
    if (isExcluded) {
      console.log(`[Cache Bypass] Excluded route: ${req.originalUrl}`);
      return next();
    }

    // Resolve cache key and TTL
    const { key: cacheKey, ttl } = resolveCacheConfig(req);

    try {
      // Step A: Check Redis first
      const cachedData = await cacheService.get(cacheKey);

      if (cachedData !== null) {
        // CACHE HIT: Return cached response immediately
        res.setHeader('X-Cache-Status', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        return res.json(cachedData);
      }

      // CACHE MISS: Intercept response to write to Redis after MongoDB finishes
      res.setHeader('X-Cache-Status', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);

      const originalSend = res.json.bind(res);
      res.json = function (body) {
        // Write to Redis asynchronously without blocking response payload delivery
        if (res.statusCode >= 200 && res.statusCode < 300 && body) {
          cacheService.set(cacheKey, body, ttl).catch((err) => {
            console.error(`[Cache Middleware Error] Async set failed for key "${cacheKey}":`, err.message);
          });
        }
        return originalSend(body);
      };

      next();
    } catch (err) {
      // Graceful fallback to MongoDB if Redis errors
      console.error('[Cache Middleware Error] Graceful fallback to database:', err.message);
      next();
    }
  };
}

module.exports = cacheMiddleware;
