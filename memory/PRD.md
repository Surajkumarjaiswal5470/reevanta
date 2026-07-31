# PRD - Lumière & Bazar (Myntra x Meesho Hybrid E-Commerce Platform)

## 1. Original Problem Statement
Create an e-commerce website for clothes, shoes, makeup, etc. like Myntra & Meesho, with search, place-order, address management, and current-location tracking.

## 2. User Personas & Choices
- **Brand Vibe**: Trendy & Vibrant, Minimalist Chic, Affordable & Social.
- **Payment**: Cash on Delivery only (Phase 2 to consider Stripe/UPI).
- **Location Provider**: Google Maps Places + Geocoding (JS SDK, key in `REACT_APP_GOOGLE_MAPS_API_KEY`).
- **Order Tracking**: Status-based timeline (Placed → Packed → Shipped → Out for Delivery → Delivered).

## 3. Core Requirements & Features Implemented
### Catalog & Discovery
- 12 seeded products across Clothes, Shoes, Makeup, Accessories in MongoDB.
- Category filters, product cards, Flash Sale, Lookbooks, Wishlist, Quick-View modal.
- Full-text tag/name/brand/description search on backend (`/api/products?q=`).
- Rich autocomplete dropdown with debounced backend suggestions, trending & recent searches.

### Cart, Address, Checkout, Orders
- Interactive sliding cart drawer with multi-step checkout.
- **Address Management** (multi-address, default selection, saved to Mongo):
  - Google Places autocomplete with structured address parsing.
  - "Use my current location" (browser Geolocation + reverse geocode).
  - Live Google Maps preview marker.
- Order placement (COD) via `/api/orders`; cancel eligible orders before shipping.
- Status-based OrderTimeline (horizontal desktop, vertical mobile).

### Admin
- Role-guarded admin panel: stats, product CRUD, order list with inline status updates.

### Auth
- JWT + HTTP-only cookies (SameSite=None, Secure).
- Login / register / me / logout endpoints.
- CORS reflected origin for credentialed requests.

## 4. Key API Endpoints
- Auth: POST /api/auth/{register,login,logout}, GET /api/auth/me
- Products: GET /api/products (q, category), GET /api/products/search-suggest, GET/POST/DELETE /api/products/{id}
- Addresses: GET/POST /api/addresses, DELETE /api/addresses/{id}, PATCH /api/addresses/{id}/default
- Orders: POST /api/orders, GET /api/orders/mine, GET/PATCH admin /api/orders, POST /api/orders/{id}/cancel

## 5. Backend Robustness Fixes (iter 2 → 3)
- Malformed ObjectId now returns 404 via `to_object_id()` helper.
- `set_default_address` verifies ownership BEFORE mutating defaults.
- `update_order_status` checks `matched_count` and returns 404 for missing orders.
- CORS reflects origin when credentials required.

## 6. Frontend Fixes (iter 2 → 3)
- Global Sonner Toaster mounted in `index.js`.
- Auth modal z-[70] above cart drawer; cart closes when auth opens from checkout.
- Mobile navbar rebuilt: compact logo, visible Orders + Login/Logout icons, bag not clipped.

## 7. Test Status
- Backend: 29/31 (94%); 100% on requested search/address/order flows.
- Frontend: 100% of executed desktop + mobile flows.
- Remaining minor: brute-force lockout & ingress-level CORS wildcard (pre-existing, out-of-scope).

## 8. Prioritized Backlog / P1-P2
1. **P1** - Split monolithic App.js into modular pages/components (>1800 lines).
2. **P1** - Prompt-based Pydantic input validators (positive amounts, non-empty items, phone/email/pincode format).
3. **P2** - Real payment gateway (Stripe / Razorpay).
4. **P2** - Live delivery agent map tracking (upgrade from status-based).
5. **P2** - Product reviews with photo uploads.
6. **P2** - Coupon codes at checkout (LUMI15 currently visual only).
7. **P3** - Login brute-force lockout (5 attempts).
