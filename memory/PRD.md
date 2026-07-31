# PRD - Lumière & Bazar (Myntra x Meesho Hybrid E-Commerce Platform)

## 1. Original Problem Statement
Create an e-commerce website for clothes, shoes, makeup, etc. like Myntra, Meesho.

## 2. User Personas & Choices
- **Brand Vibe**: Trendy & Vibrant, Minimalist Chic, Affordable & Social
- **Highlighted Sections**: Clothes, Shoes, Makeup & Beauty, Accessories, Flash Sales, Daily Deals, Wholesale/Reseller Hub, Curated Lookbooks & Trending Collections.

## 3. Core Requirements & Features Implemented
- **Multi-Category Catalog**: Browse & filter Clothes, Shoes, Makeup, and Accessories with instant search.
- **Reseller Wholesale Mode**: Toggle to view profit margins and instantly copy WhatsApp share links with markup.
- **Flash Sales & Timer**: Live countdown timer with discount badges and urgent deals.
- **Curated Lookbooks**: Shop-the-look influencer collections.
- **Interactive Quick-View Modal**: Detailed product view, size selection, and instant add-to-bag.
- **Sliding Cart & Multi-Step Checkout**: Bag management, shipping details, reseller customer destination details, and COD/UPI order confirmation.
- **Wishlist & Order History**: Save favorites and track order delivery status.

## 4. Mocked in Frontend (Phase 1 UI-First Build)
- **Product Catalog & Inventory**: Managed via `/app/frontend/src/mock.js` (will connect to FastAPI + MongoDB backend in Phase 2).
- **Orders & Checkout**: Managed via local React state and simulated success flow.

## 5. Prioritized Backlog & Next Action Items (Phase 2)
1. **Backend Wiring**: Implement FastAPI endpoints for `/api/products`, `/api/orders`, `/api/wishlist`.
2. **Database Integration**: Connect MongoDB models for Products, Orders, and Users.
3. **Authentication**: Implement JWT user registration & login (or Google Auth).
4. **Payment Gateway**: Integrate Stripe or Razorpay for online checkout.
