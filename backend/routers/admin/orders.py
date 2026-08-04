"""
Admin Orders Operations Router
Handles Order Listing, Editing, Audit Timelines, Split Shipments, Courier Tracking, Gift Orders, and Shipping Labels.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from models.order import (
    StatusUpdate, ReturnStatusUpdate, OrderEditSchema,
    TrackingUpdate, ShipmentPackage, GiftOrderMeta
)
from routers.orders import build_timeline, build_return_timeline, ORDER_STATUSES, RETURN_STATUSES

router = APIRouter(prefix="/orders", tags=["Admin - Orders"])


@router.get("")
async def list_orders_admin(admin: dict = Depends(get_current_admin)):
    """List all orders with timelines, split shipments, courier tracking, and audit logs."""
    orders = await db.orders.find({}).sort("placed_at", -1).to_list(200)
    out = []
    for o in orders:
        s = serialize_doc(o)
        s["timeline"] = build_timeline(s.get("status", "Order Placed"))
        if s.get("return_info"):
            ret_status = s["return_info"].get("return_status", "Return Requested")
            s["return_timeline"] = build_return_timeline(ret_status)
        out.append(s)
    return out


@router.get("/{order_id}")
async def get_order_details(order_id: str, admin: dict = Depends(get_current_admin)):
    """Fetch single order details."""
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    s = serialize_doc(order)
    s["timeline"] = build_timeline(s.get("status", "Order Placed"))
    return s


@router.put("/{order_id}")
async def edit_order(order_id: str, updates: OrderEditSchema, admin: dict = Depends(get_current_admin)):
    """Edit order items, shipping address, or customer contact details."""
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_dict = updates.model_dump(exclude_unset=True, exclude_none=True)

    # Recalculate subtotal & total if items were updated
    if "items" in update_dict:
        items_list = update_dict["items"]
        new_total = sum(i.get("price", 0) * i.get("qty", 1) for i in items_list)
        update_dict["total"] = new_total

    # Append to timeline events audit log
    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": admin.get("email", "Admin Staff"),
        "action": "Order Edited",
        "notes": "Updated order items / shipping address details"
    }

    await db.orders.update_one(
        {"_id": to_object_id(order_id)},
        {
            "$set": update_dict,
            "$push": {"timeline_events": event}
        }
    )

    updated = await db.orders.find_one({"_id": to_object_id(order_id)})
    return serialize_doc(updated)


@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, inp: StatusUpdate, admin: dict = Depends(get_current_admin)):
    """Update order fulfillment status with audit logging."""
    if inp.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {ORDER_STATUSES}")

    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    old_status = order.get("status", "Order Placed")

    # Append to audit timeline events
    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": inp.actor or admin.get("email", "Admin Staff"),
        "action": f"Status changed to '{inp.status}'",
        "old_status": old_status,
        "new_status": inp.status,
        "notes": inp.notes or ""
    }

    await db.orders.update_one(
        {"_id": to_object_id(order_id)},
        {
            "$set": {"status": inp.status, "updated_at": datetime.now(timezone.utc).isoformat()},
            "$push": {"timeline_events": event}
        }
    )

    return {
        "message": f"Order status updated to '{inp.status}'",
        "status": inp.status,
        "timeline": build_timeline(inp.status)
    }


@router.patch("/{order_id}/tracking")
async def update_tracking(order_id: str, inp: TrackingUpdate, admin: dict = Depends(get_current_admin)):
    """Assign courier name and primary tracking number."""
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": admin.get("email", "Admin Staff"),
        "action": f"Assigned tracking number '{inp.trackingNumber}' via {inp.courier}",
        "notes": inp.trackingUrl or ""
    }

    await db.orders.update_one(
        {"_id": to_object_id(order_id)},
        {
            "$set": {
                "courier": inp.courier,
                "tracking_number": inp.trackingNumber,
                "tracking_url": inp.trackingUrl,
                "updated_at": datetime.now(timezone.utc).isoformat()
            },
            "$push": {"timeline_events": event}
        }
    )

    return {"message": "Tracking details saved successfully"}


@router.post("/{order_id}/shipments")
async def add_split_shipment(order_id: str, pkg: ShipmentPackage, admin: dict = Depends(get_current_admin)):
    """Create a split / partial shipment package for an order."""
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    shipment_doc = pkg.model_dump()
    shipment_doc["shipment_id"] = f"PKG-{(order.get('shipments', []) or []).__len__() + 1:03d}"
    shipment_doc["shipped_at"] = datetime.now(timezone.utc).isoformat()

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": admin.get("email", "Admin Staff"),
        "action": f"Created split shipment package {shipment_doc['shipment_id']}",
        "notes": f"Tracking: {pkg.tracking_number} via {pkg.courier}"
    }

    await db.orders.update_one(
        {"_id": to_object_id(order_id)},
        {
            "$push": {
                "shipments": shipment_doc,
                "timeline_events": event
            }
        }
    )

    updated = await db.orders.find_one({"_id": to_object_id(order_id)})
    return serialize_doc(updated)


@router.patch("/{order_id}/gift")
async def update_gift_options(order_id: str, gift: GiftOrderMeta, admin: dict = Depends(get_current_admin)):
    """Update gift wrapping options and personalized gift message."""
    order = await db.orders.find_one({"_id": to_object_id(order_id)})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    await db.orders.update_one(
        {"_id": to_object_id(order_id)},
        {"$set": {"gift_info": gift.model_dump()}}
    )

    return {"message": "Gift order options updated"}


@router.patch("/{order_id}/return-status")
async def update_return_status(order_id: str, inp: ReturnStatusUpdate, admin: dict = Depends(get_current_admin)):
    """Update return status for an order."""
    if inp.returnStatus not in RETURN_STATUSES:
        raise HTTPException(status_code=400, detail=f"Return status must be one of {RETURN_STATUSES}")
    obj_id = to_object_id(order_id)
    order = await db.orders.find_one({"_id": obj_id})
    if not order or not order.get("return_info"):
        raise HTTPException(status_code=404, detail="No active return request found for this order")

    event = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "actor": admin.get("email", "Admin Staff"),
        "action": f"Return status updated to '{inp.returnStatus}'",
        "notes": inp.notes or ""
    }

    await db.orders.update_one(
        {"_id": obj_id},
        {
            "$set": {"return_info.return_status": inp.returnStatus, "return_status": inp.returnStatus},
            "$push": {"timeline_events": event}
        }
    )
    return {
        "message": "Return status updated",
        "return_status": inp.returnStatus,
        "return_timeline": build_return_timeline(inp.returnStatus)
    }
