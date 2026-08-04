"""
Admin & Public Shipping & Logistics Operations Router
Provides public rate calculations for checkout and admin management of Shipping Zones, Methods, Courier Partners, Free Shipping Thresholds, and COD Rules.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from models.shipping import (
    ShippingZoneCreate, ShippingZoneUpdate, CourierPartnerSchema,
    CalculateShippingRequest
)

router = APIRouter(prefix="/shipping", tags=["Admin - Shipping"])
public_router = APIRouter(prefix="/shipping", tags=["Shipping"])


# Default Pre-seeded Shipping Zones
DEFAULT_SHIPPING_ZONES = [
    {
        "name": "Kathmandu Valley Express Zone",
        "code": "KTM_VALLEY",
        "regions": ["Kathmandu", "Lalitpur", "Bhaktapur"],
        "free_shipping_threshold": 1499.0,
        "cod_available": True,
        "is_active": True,
        "sort_order": 1,
        "methods": [
            {
                "method_id": "exp-ktm",
                "name": "Kathmandu Same-Day Express",
                "delivery_time_text": "Same Day (Within 12 Hours)",
                "base_charge": 100.0,
                "courier_partner": "Nepal Express",
                "weight_charge_per_kg": 0.0,
                "cod_fee": 0.0,
                "is_active": True
            },
            {
                "method_id": "std-ktm",
                "name": "Standard Valley Delivery",
                "delivery_time_text": "1–2 Business Days",
                "base_charge": 60.0,
                "courier_partner": "Nepal Express",
                "weight_charge_per_kg": 0.0,
                "cod_fee": 0.0,
                "is_active": True
            }
        ]
    },
    {
        "name": "Nepal National Outer Zone",
        "code": "NEP_NAT",
        "regions": ["Pokhara", "Chitwan", "Biratnagar", "Butwal", "Dharan", "Nepalgunj", "Rest of Nepal"],
        "free_shipping_threshold": 2999.0,
        "cod_available": True,
        "is_active": True,
        "sort_order": 2,
        "methods": [
            {
                "method_id": "std-nat",
                "name": "National Standard Delivery",
                "delivery_time_text": "2–4 Business Days",
                "base_charge": 200.0,
                "courier_partner": "Nepal Express",
                "weight_charge_per_kg": 50.0,
                "cod_fee": 50.0,
                "is_active": True
            }
        ]
    },
    {
        "name": "India & SAARC Regional Zone",
        "code": "SAARC",
        "regions": ["India", "Bhutan", "Bangladesh", "Sri Lanka", "Maldives"],
        "free_shipping_threshold": 9999.0,
        "cod_available": False,
        "is_active": True,
        "sort_order": 3,
        "methods": [
            {
                "method_id": "air-saarc",
                "name": "SAARC Regional Air Express",
                "delivery_time_text": "5–7 Business Days",
                "base_charge": 800.0,
                "courier_partner": "Aramex",
                "weight_charge_per_kg": 200.0,
                "cod_fee": 0.0,
                "is_active": True
            }
        ]
    },
    {
        "name": "Worldwide International Zone",
        "code": "INTL",
        "regions": ["USA", "UK", "Australia", "Canada", "Europe", "UAE", "Worldwide"],
        "free_shipping_threshold": 25000.0,
        "cod_available": False,
        "is_active": True,
        "sort_order": 4,
        "methods": [
            {
                "method_id": "dhl-intl",
                "name": "DHL Express Worldwide Air",
                "delivery_time_text": "7–10 International Days",
                "base_charge": 2500.0,
                "courier_partner": "DHL Express",
                "weight_charge_per_kg": 500.0,
                "cod_fee": 0.0,
                "is_active": True
            }
        ]
    }
]

DEFAULT_COURIERS = [
    {
        "name": "Nepal Express",
        "logo_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200",
        "tracking_url_template": "https://nepalexpress.com/track?num={tracking_number}",
        "is_active": True
    },
    {
        "name": "DHL Express",
        "logo_url": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=200",
        "tracking_url_template": "https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}",
        "is_active": True
    },
    {
        "name": "FedEx International",
        "logo_url": "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=200",
        "tracking_url_template": "https://www.fedex.com/fedextrack/?trknbr={tracking_number}",
        "is_active": True
    },
    {
        "name": "Aramex",
        "logo_url": "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=200",
        "tracking_url_template": "https://www.aramex.com/express/track-results-detail?mode=0&ShipmentNumber={tracking_number}",
        "is_active": True
    }
]


# ──────────────────── PUBLIC SHIPPING CALCULATION ────────────────────

@public_router.post("/calculate")
async def calculate_shipping_options(req: CalculateShippingRequest):
    """Public endpoint to calculate available shipping methods, fees, and free shipping waivers for checkout."""
    zones = await db.shipping_zones.find({"is_active": True}).sort("sort_order", 1).to_list(100)
    if not zones:
        zones = DEFAULT_SHIPPING_ZONES

    dest_city = (req.destination_city or "Kathmandu").strip().lower()
    dest_country = (req.destination_country or "Nepal").strip().lower()

    # Find matching zone
    matched_zone = None
    for z in zones:
        regions = [r.lower() for r in z.get("regions", [])]
        if dest_city in regions or dest_country in regions:
            matched_zone = z
            break

    if not matched_zone:
        # Default to first zone
        matched_zone = zones[0]

    free_threshold = float(matched_zone.get("free_shipping_threshold", 1499.0))
    is_free_shipping = req.cart_total >= free_threshold

    calculated_methods = []
    for m in matched_zone.get("methods", []):
        if not m.get("is_active", True):
            continue

        base_fee = float(m.get("base_charge", 0.0))
        weight_fee = float(m.get("weight_charge_per_kg", 0.0)) * max(0.0, req.total_weight_kg - 1.0)
        total_fee = 0.0 if is_free_shipping else (base_fee + weight_fee)

        calculated_methods.append({
            "method_id": m.get("method_id"),
            "name": m.get("name"),
            "delivery_time_text": m.get("delivery_time_text"),
            "charge": round(total_fee, 2),
            "original_charge": round(base_fee + weight_fee, 2),
            "is_free_shipping": is_free_shipping,
            "courier_partner": m.get("courier_partner"),
            "cod_available": matched_zone.get("cod_available", True),
            "cod_fee": float(m.get("cod_fee", 0.0))
        })

    return {
        "zone_name": matched_zone.get("name"),
        "free_shipping_threshold": free_threshold,
        "is_free_shipping_applied": is_free_shipping,
        "cod_available": matched_zone.get("cod_available", True),
        "available_methods": calculated_methods
    }


# ──────────────────── ADMIN ZONES CRUD ────────────────────

@router.get("/zones")
async def list_shipping_zones(admin: dict = Depends(get_current_admin)):
    """Fetch all shipping zones."""
    zones = await db.shipping_zones.find({}).sort("sort_order", 1).to_list(100)
    if not zones:
        seeded = []
        try:
            for z in DEFAULT_SHIPPING_ZONES:
                z_copy = dict(z)
                z_copy["created_at"] = datetime.now(timezone.utc).isoformat()
                res = await db.shipping_zones.insert_one(z_copy)
                z_copy["id"] = str(res.inserted_id)
                z_copy.pop("_id", None)
                seeded.append(z_copy)
            return seeded
        except Exception:
            return DEFAULT_SHIPPING_ZONES
    return [serialize_doc(z) for z in zones]


@router.post("/zones")
async def create_shipping_zone(inp: ShippingZoneCreate, admin: dict = Depends(get_current_admin)):
    """Create a new shipping zone."""
    code_clean = inp.code.strip().upper()
    doc = inp.model_dump()
    doc["code"] = code_clean
    doc["created_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.shipping_zones.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@router.put("/zones/{zone_id}")
async def update_shipping_zone(zone_id: str, updates: ShippingZoneUpdate, admin: dict = Depends(get_current_admin)):
    """Update shipping zone details, methods, and thresholds."""
    update_dict = updates.model_dump(exclude_unset=True, exclude_none=True)
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.shipping_zones.update_one({"_id": to_object_id(zone_id)}, {"$set": update_dict})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Shipping zone not found")

    updated = await db.shipping_zones.find_one({"_id": to_object_id(zone_id)})
    return serialize_doc(updated)


@router.delete("/zones/{zone_id}")
async def delete_shipping_zone(zone_id: str, admin: dict = Depends(get_current_admin)):
    """Delete a shipping zone."""
    res = await db.shipping_zones.delete_one({"_id": to_object_id(zone_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Shipping zone not found")
    return {"message": "Shipping zone deleted successfully"}


# ──────────────────── COURIER PARTNERS ────────────────────

@router.get("/couriers")
async def list_couriers(admin: dict = Depends(get_current_admin)):
    """Fetch courier partner profiles."""
    couriers = await db.courier_partners.find({}).to_list(100)
    if not couriers:
        seeded = []
        try:
            for c in DEFAULT_COURIERS:
                c_copy = dict(c)
                c_copy["created_at"] = datetime.now(timezone.utc).isoformat()
                res = await db.courier_partners.insert_one(c_copy)
                c_copy["id"] = str(res.inserted_id)
                c_copy.pop("_id", None)
                seeded.append(c_copy)
            return seeded
        except Exception:
            return DEFAULT_COURIERS
    return [serialize_doc(c) for c in couriers]


@router.post("/couriers")
async def create_courier(inp: CourierPartnerSchema, admin: dict = Depends(get_current_admin)):
    """Create a new courier partner profile."""
    doc = inp.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.courier_partners.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc
