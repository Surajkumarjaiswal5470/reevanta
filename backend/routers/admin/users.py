"""
Admin Users & Customer Management Router
Provides customer search, segmentation tiers, order/spend metrics, purchase history, saved addresses,
live cart/wishlist inspection, loyalty points & wallet ledger, internal notes, and account blocking.
"""

import math
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin

router = APIRouter(prefix="/users", tags=["Admin - Users"])


# ──────────────────── Pydantic Models ────────────────────

class BlockUserRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=500, examples=["Spam & fake review submissions"])
    duration_days: Optional[int] = Field(None, ge=1, le=3650, examples=[30])


class WalletAdjustRequest(BaseModel):
    amount: float = Field(0.0, examples=[500.0])
    points: int = Field(0, examples=[50])
    action_type: str = Field("CREDIT", pattern="^(CREDIT|DEBIT)$")
    reason: str = Field(..., min_length=3, max_length=300, examples=["VIP Promotional Reward"])


class CustomerNoteRequest(BaseModel):
    text: str = Field(..., min_length=2, max_length=1000)


def calculate_tier(total_spent: float) -> str:
    if total_spent >= 50000:
        return "VIP Royal"
    elif total_spent >= 20000:
        return "Gold Patron"
    elif total_spent >= 5000:
        return "Silver Shopper"
    return "Bronze Member"


# ──────────────────── GET List Users ────────────────────

@router.get("")
async def list_users_admin(
    search: Optional[str] = None,
    status: Optional[str] = Query(None, pattern="^(active|blocked)$"),
    tier: Optional[str] = Query(None, pattern="^(VIP Royal|Gold Patron|Silver Shopper|Bronze Member)$"),
    role: Optional[str] = Query(None, pattern="^(user|admin|reseller)$"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    admin: dict = Depends(get_current_admin),
):
    """Fetch users with search, status, segmentation tiers, and order/spend metrics."""
    query = {}

    if status == "blocked":
        query["is_blocked"] = True
    elif status == "active":
        query["$or"] = [{"is_blocked": False}, {"is_blocked": {"$exists": False}}]

    if role:
        query["role"] = role

    if search:
        search_regex = {"$regex": search, "$options": "i"}
        search_query = [
            {"name": search_regex},
            {"email": search_regex},
            {"phone": search_regex},
        ]
        if "$or" in query:
            query["$and"] = [{"$or": query.pop("$or")}, {"$or": search_query}]
        else:
            query["$or"] = search_query

    users = await db.users.find(query).sort("created_at", -1).to_list(1000)

    # Enrich users with spend & tier calculation
    enriched = []
    for u in users:
        s = serialize_doc(u)
        s.pop("password_hash", None)

        user_id = s.get("id")
        user_phone = s.get("phone")
        user_email = s.get("email")

        order_clauses = []
        if user_id:
            order_clauses.append({"user_id": user_id})
        if user_phone:
            order_clauses.extend([{"phone": user_phone}, {"customerPhone": user_phone}])
        if user_email:
            order_clauses.extend([{"email": user_email}, {"customerEmail": user_email}])

        order_count = 0
        total_spent = 0.0

        if order_clauses:
            try:
                user_orders = await db.orders.find({"$or": order_clauses}).to_list(1000)
                order_count = len(user_orders)
                total_spent = round(sum(float(o.get("total", 0)) for o in user_orders if o.get("status") != "Cancelled"), 2)
            except Exception:
                pass

        user_tier = calculate_tier(total_spent)
        s["order_count"] = order_count
        s["total_spent"] = total_spent
        s["tier"] = user_tier
        s["wallet_balance"] = float(s.get("wallet_balance") or 0.0)
        s["loyalty_points"] = int(s.get("loyalty_points") or 0)

        if tier and user_tier != tier:
            continue

        enriched.append(s)

    total = len(enriched)
    skip = (page - 1) * limit
    paginated = enriched[skip : skip + limit]

    return {
        "users": paginated,
        "total": total,
        "page": page,
        "limit": limit,
        "pages": max(1, math.ceil(total / limit))
    }


# ──────────────────── GET Customer Details Deep-Dive ────────────────────

@router.get("/{user_id}/details")
async def get_customer_details(user_id: str, admin: dict = Depends(get_current_admin)):
    """Fetch complete customer profile, purchase history, saved addresses, wishlist, live cart, loyalty ledger, and internal notes."""
    user = await db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    u_data = serialize_doc(user)
    u_data.pop("password_hash", None)

    user_phone = u_data.get("phone")
    user_email = u_data.get("email")

    # Fetch Order History
    order_clauses = [{"user_id": user_id}]
    if user_phone:
        order_clauses.extend([{"phone": user_phone}, {"customerPhone": user_phone}])
    if user_email:
        order_clauses.extend([{"email": user_email}, {"customerEmail": user_email}])

    orders = await db.orders.find({"$or": order_clauses}).sort("placed_at", -1).to_list(100)
    orders_serialized = [serialize_doc(o) for o in orders]

    order_count = len(orders_serialized)
    total_spent = round(sum(float(o.get("total", 0)) for o in orders_serialized if o.get("status") != "Cancelled"), 2)
    avg_order_value = round(total_spent / order_count, 2) if order_count > 0 else 0.0

    # Fetch Saved Addresses
    addresses = u_data.get("addresses") or []

    # Fetch Wishlist & Cart from DB or User document
    cart_doc = await db.carts.find_one({"user_id": user_id})
    wishlist_doc = await db.wishlists.find_one({"user_id": user_id})

    cart_items = (cart_doc.get("items") if cart_doc else None) or u_data.get("cart") or []
    wishlist_items = (wishlist_doc.get("items") if wishlist_doc else None) or u_data.get("wishlist") or []

    tier = calculate_tier(total_spent)

    u_data.update({
        "orders": orders_serialized,
        "order_count": order_count,
        "total_spent": total_spent,
        "avg_order_value": avg_order_value,
        "tier": tier,
        "addresses": addresses,
        "cart_items": cart_items,
        "wishlist_items": wishlist_items,
        "wallet_balance": float(u_data.get("wallet_balance") or 0.0),
        "loyalty_points": int(u_data.get("loyalty_points") or 0),
        "points_ledger": u_data.get("points_ledger") or [],
        "internal_notes": u_data.get("internal_notes") or []
    })

    return u_data


# ──────────────────── POST Wallet / Loyalty Adjustments ────────────────────

@router.post("/{user_id}/wallet-adjust")
async def adjust_customer_wallet(
    user_id: str,
    inp: WalletAdjustRequest,
    admin: dict = Depends(get_current_admin),
):
    """Credit or debit customer wallet funds / loyalty points."""
    user = await db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    cur_wallet = float(user.get("wallet_balance") or 0.0)
    cur_points = int(user.get("loyalty_points") or 0)

    delta_wallet = inp.amount if inp.action_type == "CREDIT" else -inp.amount
    delta_points = inp.points if inp.action_type == "CREDIT" else -inp.points

    new_wallet = max(0.0, cur_wallet + delta_wallet)
    new_points = max(0, cur_points + delta_points)

    ledger_entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "action_type": inp.action_type,
        "amount": inp.amount,
        "points": inp.points,
        "reason": inp.reason,
        "admin": admin.get("email", "Admin Staff")
    }

    await db.users.update_one(
        {"_id": to_object_id(user_id)},
        {
            "$set": {
                "wallet_balance": new_wallet,
                "loyalty_points": new_points,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"points_ledger": ledger_entry}
        }
    )

    return {
        "message": f"Successfully updated wallet ({inp.action_type})",
        "new_wallet_balance": new_wallet,
        "new_loyalty_points": new_points
    }


# ──────────────────── POST Internal Staff Notes ────────────────────

@router.post("/{user_id}/notes")
async def add_customer_note(
    user_id: str,
    inp: CustomerNoteRequest,
    admin: dict = Depends(get_current_admin),
):
    """Add internal staff note to a customer profile."""
    user = await db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Customer not found")

    note_doc = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "admin": admin.get("email", "Admin Staff"),
        "text": inp.text
    }

    await db.users.update_one(
        {"_id": to_object_id(user_id)},
        {"$push": {"internal_notes": note_doc}}
    )

    return {"message": "Staff note added successfully", "note": note_doc}


# ──────────────────── Block / Unblock ────────────────────

@router.post("/{user_id}/block")
async def block_user_admin(
    user_id: str,
    inp: BlockUserRequest,
    admin: dict = Depends(get_current_admin),
):
    """Block a user account with reason."""
    user = await db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    block_data = {
        "is_blocked": True,
        "blocked_at": datetime.now(timezone.utc).isoformat(),
        "block_reason": inp.reason,
        "blocked_by": admin.get("email", "Admin"),
    }

    await db.users.update_one({"_id": to_object_id(user_id)}, {"$set": block_data})
    return {"message": f"User '{user.get('name')}' blocked successfully", "reason": inp.reason}


@router.post("/{user_id}/unblock")
async def unblock_user_admin(user_id: str, admin: dict = Depends(get_current_admin)):
    """Unblock a user account."""
    user = await db.users.find_one({"_id": to_object_id(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    unblock_data = {
        "is_blocked": False,
        "unblocked_at": datetime.now(timezone.utc).isoformat(),
        "unblocked_by": admin.get("email", "Admin"),
    }

    await db.users.update_one({"_id": to_object_id(user_id)}, {"$set": unblock_data})
    return {"message": f"User '{user.get('name')}' unblocked successfully"}
