"""
Production Reset Script for RIVAANTA Storefront
Wipes all demo/test data (products, customer accounts, reviews, orders, vouchers, carts, addresses)
while PRESERVING the Super Admin user account.
"""

import asyncio
import os
import sys

# Add backend root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from core.database import db
from core.cache import cache_invalidate_pattern
from services.meilisearch_service import clear_search_index


async def reset_production_data(keep_seed_products: bool = False):
    print("[RESET] Starting Complete Production Data Reset...")

    # 1. Preserve Admin user, delete all customer accounts
    admin_users = await db.users.find({"role": "admin"}).to_list(100)
    user_del_res = await db.users.delete_many({"role": {"$ne": "admin"}})
    print(f"[USERS] Preserved {len(admin_users)} Admin account(s). Deleted {user_del_res.deleted_count} customer account(s).")

    # 2. Products
    if not keep_seed_products:
        prod_res = await db.products.delete_many({})
        print(f"[PRODUCTS] Deleted {prod_res.deleted_count} product(s) from catalog.")
    else:
        print("[PRODUCTS] Preserved products catalog as requested.")

    # 3. Reviews & Ratings
    rev_res = await db.reviews.delete_many({})
    print(f"[REVIEWS] Deleted {rev_res.deleted_count} review(s) & ratings.")

    # 4. Orders
    ord_res = await db.orders.delete_many({})
    print(f"[ORDERS] Deleted {ord_res.deleted_count} order(s).")

    # 5. Vouchers & Coupons
    vouch_res = await db.vouchers.delete_many({})
    print(f"[VOUCHERS] Deleted {vouch_res.deleted_count} voucher(s).")

    # 6. Carts
    cart_res = await db.carts.delete_many({})
    print(f"[CARTS] Deleted {cart_res.deleted_count} active cart session(s).")

    # 7. Customer Addresses
    addr_res = await db.addresses.delete_many({})
    print(f"[ADDRESSES] Deleted {addr_res.deleted_count} customer address(es).")

    # 8. Notifications & Chat Desk Logs
    notif_res = await db.notifications.delete_many({})
    chat_res = await db.support_chats.delete_many({})
    print(f"[NOTIFICATIONS] Deleted {notif_res.deleted_count} notification(s) and {chat_res.deleted_count} support chat session(s).")

    # 9. Clear Redis Cache & Search Index
    try:
        await cache_invalidate_pattern("*")
        clear_search_index()
        print("[CACHE] Redis cache & search index cleared successfully.")
    except Exception as err:
        print(f"[CACHE WARNING] Cache/Index clear warning: {err}")

    print("\n[COMPLETE] Production Reset Complete! Your store database is clean and ready for live production launch.")


if __name__ == "__main__":
    asyncio.run(reset_production_data())
