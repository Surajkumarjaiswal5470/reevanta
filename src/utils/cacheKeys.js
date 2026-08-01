/**
 * Standardized Cache Key Generators
 * ──────────────────────────────────────────────────────────
 * Provides consistent, collision-free Redis key strings across the application.
 */

const cacheKeys = {
  /**
   * Key for Homepage cached response
   * @returns {string} "home"
   */
  home: () => 'home',

  /**
   * Key for Featured items catalog
   * @returns {string} "featured"
   */
  featured: () => 'featured',

  /**
   * Key for Categories listing
   * @returns {string} "categories"
   */
  categories: () => 'categories',

  /**
   * Key for individual Item / Listing details
   * @param {string|number} listingId
   * @returns {string} "listing:{listingId}"
   */
  listing: (listingId) => `listing:${listingId}`,

  /**
   * Key for Search results with query, page, and filter parameters
   * @param {string} query
   * @param {number|string} page
   * @param {object|string} filters
   * @returns {string} "search:{query}:{page}:{filters}"
   */
  search: (query = '', page = 1, filters = '') => {
    const filterString = typeof filters === 'object' ? JSON.stringify(filters) : String(filters);
    const cleanQuery = String(query).trim().toLowerCase();
    return `search:${cleanQuery}:${page}:${filterString}`;
  },

  /**
   * Key for Geolocation Nearby items query
   * @param {number|string} lat
   * @param {number|string} lng
   * @param {number|string} radius
   * @returns {string} "nearby:{lat}:{lng}:{radius}"
   */
  nearby: (lat, lng, radius = 10) => {
    const roundedLat = Number(lat).toFixed(3);
    const roundedLng = Number(lng).toFixed(3);
    return `nearby:${roundedLat}:${roundedLng}:${radius}`;
  },
};

module.exports = cacheKeys;
