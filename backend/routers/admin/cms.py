"""
Admin & Public CMS Promotions Operations Router
Provides public endpoints for storefront rendering and admin endpoints for managing Hero Slides, Announcement Bar, Countdown Timers, Seasonal Campaigns, and Popups.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from models.cms import (
    HeroSlideSchema, AnnouncementBarSchema, CountdownTimerSchema,
    PromoPopupSchema, SeasonalCampaignSchema, HomepageCMSUpdate
)

router = APIRouter(prefix="", tags=["CMS - Content Management"])

DEFAULT_BANNERS = [
    {
        "id": "slide-saree-01",
        "title": "Royal Kanjivaram Silk Collection",
        "subtitle": "Handcrafted pure silk sarees with authentic Zari gold embroidery.",
        "category": "sarees",
        "buttonText": "EXPLORE SILK SAREES",
        "buttonLink": "/catalog?category=sarees",
        "image": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600&q=80",
        "badge": "SIGNATURE COLLECTION 2026",
        "slide_order": 1,
        "isActive": True
    },
    {
        "id": "slide-lehenga-02",
        "title": "Zardozi Atelier Bridal Lehengas",
        "subtitle": "Intricate hand-embroidered wedding lehengas and choli sets.",
        "category": "lehengas",
        "buttonText": "SHOP BRIDAL LEHENGAS",
        "buttonLink": "/catalog?category=lehengas",
        "image": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1600&q=80",
        "badge": "BRIDAL EDITION • HEAVY WORK",
        "slide_order": 2,
        "isActive": True
    },
    {
        "id": "slide-jewelry-03",
        "title": "Kundan Heritage Fine Gold Jewelry",
        "subtitle": "Royal Kundan chokers, Rani haars, and bridal jewelry sets.",
        "category": "jewelry",
        "buttonText": "EXPLORE FINE JEWELRY",
        "buttonLink": "/catalog?category=jewelry",
        "image": "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1600&q=80",
        "badge": "HERITAGE JEWELRY",
        "slide_order": 3,
        "isActive": True
    }
]

DEFAULT_ANNOUNCEMENT = {
    "enabled": True,
    "text": "✨ Complimentary Express Delivery Across Kathmandu & Worldwide Shipping Available!",
    "link": "/catalog",
    "bgColor": "#5C1E1E",
    "textColor": "#FAF5EC"
}

DEFAULT_COUNTDOWN = {
    "enabled": True,
    "title": "⚡ ROYAL FESTIVE FLASH SALE",
    "subtitle": "Limited time heritage collection discounts ending soon.",
    "end_datetime": "2026-12-31T23:59:59Z",
    "ctaText": "SHOP FLASH DEALS",
    "ctaLink": "/catalog?is_flash_sale=true",
    "bannerUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c"
}

DEFAULT_POPUP = {
    "enabled": True,
    "title": "Enjoy 10% OFF Your First Royal Order",
    "subtitle": "Subscribe to our exclusive heritage VIP newsletter.",
    "imageUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
    "discountCode": "WELCOME10",
    "delaySeconds": 5,
    "popupType": "NEWSLETTER"
}

DEFAULT_CAMPAIGNS = [
    {
        "id": "camp-dashain",
        "name": "Festive Silk & Bridal Season 2026",
        "season": "Festive",
        "bannerUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
        "description": "Exclusive festival discounts on royal silk sarees and Kundan jewelry.",
        "startDate": "2026-09-01",
        "endDate": "2026-11-15",
        "isActive": True
    }
]


# ──────────────────── PUBLIC ENDPOINT ────────────────────

@router.get("/cms/homepage")
async def get_homepage_cms():
    """Public endpoint to fetch structured homepage CMS data for storefront rendering."""
    doc = await db.cms.find_one({"type": "homepage"})
    if not doc:
        return {
            "hero_slides": DEFAULT_BANNERS,
            "announcement_bar": DEFAULT_ANNOUNCEMENT,
            "countdown_timer": DEFAULT_COUNTDOWN,
            "promo_popup": DEFAULT_POPUP,
            "seasonal_campaigns": DEFAULT_CAMPAIGNS
        }
    serialized = serialize_doc(doc)
    serialized.pop("_id", None)
    serialized.pop("type", None)
    return serialized


# ──────────────────── ADMIN ENDPOINTS ────────────────────

@router.get("/admin/cms/homepage")
async def get_admin_homepage_cms(admin: dict = Depends(get_current_admin)):
    """Fetch complete CMS configuration for admin management."""
    return await get_homepage_cms()


@router.put("/admin/cms/hero-slides")
async def update_hero_slides(slides: List[HeroSlideSchema], admin: dict = Depends(get_current_admin)):
    """Update or reorder Hero Slider Carousel slides."""
    slides_docs = [s.model_dump() for s in slides]
    await db.cms.update_one(
        {"type": "homepage"},
        {"$set": {"hero_slides": slides_docs, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Hero slides updated successfully", "hero_slides": slides_docs}


@router.put("/admin/cms/announcement")
async def update_announcement_bar(bar: AnnouncementBarSchema, admin: dict = Depends(get_current_admin)):
    """Update Top Announcement Bar Ticker."""
    bar_doc = bar.model_dump()
    await db.cms.update_one(
        {"type": "homepage"},
        {"$set": {"announcement_bar": bar_doc, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Announcement bar updated", "announcement_bar": bar_doc}


@router.put("/admin/cms/countdown")
async def update_countdown_timer(timer: CountdownTimerSchema, admin: dict = Depends(get_current_admin)):
    """Update Deals of the Day & Countdown Timer."""
    timer_doc = timer.model_dump()
    await db.cms.update_one(
        {"type": "homepage"},
        {"$set": {"countdown_timer": timer_doc, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Countdown timer updated", "countdown_timer": timer_doc}


@router.put("/admin/cms/popup")
async def update_promo_popup(popup: PromoPopupSchema, admin: dict = Depends(get_current_admin)):
    """Update Storefront Modal Promotional Popup."""
    popup_doc = popup.model_dump()
    await db.cms.update_one(
        {"type": "homepage"},
        {"$set": {"promo_popup": popup_doc, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Promotional popup updated", "promo_popup": popup_doc}


@router.put("/admin/cms/campaigns")
async def update_seasonal_campaigns(campaigns: List[SeasonalCampaignSchema], admin: dict = Depends(get_current_admin)):
    """Update Seasonal Campaigns list."""
    camp_docs = [c.model_dump() for c in campaigns]
    await db.cms.update_one(
        {"type": "homepage"},
        {"$set": {"seasonal_campaigns": camp_docs, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    return {"message": "Seasonal campaigns updated", "seasonal_campaigns": camp_docs}
