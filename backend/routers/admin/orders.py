from fastapi import APIRouter, HTTPException, Depends
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from models.order import StatusUpdate, ReturnStatusUpdate
from routers.orders import build_timeline, build_return_timeline, ORDER_STATUSES, RETURN_STATUSES

router = APIRouter(prefix="/orders", tags=["Admin - Orders"])

@router.get("")
async def list_orders_admin(admin: dict = Depends(get_current_admin)):
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

@router.patch("/{order_id}/status")
async def update_order_status(order_id: str, inp: StatusUpdate, admin: dict = Depends(get_current_admin)):
    if inp.status not in ORDER_STATUSES:
        raise HTTPException(status_code=400, detail=f"Status must be one of {ORDER_STATUSES}")
    res = await db.orders.update_one({"_id": to_object_id(order_id)}, {"$set": {"status": inp.status}})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": "Order status updated", "status": inp.status}

@router.patch("/{order_id}/return-status")
async def update_return_status(order_id: str, inp: ReturnStatusUpdate, admin: dict = Depends(get_current_admin)):
    if inp.returnStatus not in RETURN_STATUSES:
        raise HTTPException(status_code=400, detail=f"Return status must be one of {RETURN_STATUSES}")
    obj_id = to_object_id(order_id)
    order = await db.orders.find_one({"_id": obj_id})
    if not order or not order.get("return_info"):
        raise HTTPException(status_code=404, detail="No active return request found for this order")
    
    await db.orders.update_one(
        {"_id": obj_id},
        {"$set": {"return_info.return_status": inp.returnStatus, "return_status": inp.returnStatus}}
    )
    return {
        "message": "Return status updated",
        "return_status": inp.returnStatus,
        "return_timeline": build_return_timeline(inp.returnStatus)
    }
