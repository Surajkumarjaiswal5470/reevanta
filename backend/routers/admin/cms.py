from fastapi import APIRouter, Depends, HTTPException
from core.database import db, serialize_doc
from core.security import get_current_admin
from models.cms import HomepageCMS

router = APIRouter(prefix="", tags=["CMS - Content Management"])

DEFAULT_BANNERS = [
    {
        "id": "slide-1",
        "title": "New Season Essentials",
        "subtitle": "Timeless styles for the modern woman.",
        "category": "sarees",
        "buttonText": "SHOP NOW",
        "image": "https://images.unsplash.com/photo-1610030469668-8e450b47a4a5?auto=format&fit=crop&w=1200&q=80",
        "badge": "FESTIVE COLLECTION 2026",
    },
    {
        "id": "slide-2",
        "title": "Bridal Heritage Lehengas",
        "subtitle": "Handcrafted royal velvet & gold zari embroidery.",
        "category": "lehenga",
        "buttonText": "EXPLORE LEHENGAS",
        "image": "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80",
        "badge": "BRIDAL WEAR",
    },
    {
        "id": "slide-3",
        "title": "Royal Silk Kurtas & Suits",
        "subtitle": "Pure silk tailoring crafted for grand celebrations.",
        "category": "kurtas",
        "buttonText": "VIEW KURTAS",
        "image": "https://images.unsplash.com/photo-1614886137916-64e663c21459?auto=format&fit=crop&w=1200&q=80",
        "badge": "ROYAL SUITS",
    },
    {
        "id": "slide-4",
        "title": "Artisanal Velvet Cosmetics",
        "subtitle": "Dewy finish, velvet lips & subtle gold sparkle ritual.",
        "category": "cosmetics",
        "buttonText": "SHOP COSMETICS",
        "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
        "badge": "LUXURY BEAUTY",
    },
    {
        "id": "slide-5",
        "title": "Embroidered Ethnic Footwear",
        "subtitle": "Handcrafted zardosi juttis and luxury sandals.",
        "category": "footwear",
        "buttonText": "EXPLORE FOOTWEAR",
        "image": "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1200&q=80",
        "badge": "ETHNIC FOOTWEAR",
    },
    {
        "id": "slide-6",
        "title": "Heritage Kundan & Gold Jewelry",
        "subtitle": "Exquisite royal necklaces, bangles & maang tikkas.",
        "category": "jewelry",
        "buttonText": "SHOP JEWELRY",
        "image": "https://images.unsplash.com/photo-1515562141589-67f0d932b7d6?auto=format&fit=crop&w=1200&q=80",
        "badge": "ROYAL JEWELRY",
    },
]

DEFAULT_CMS = {
    "heroTitle": "Embrace Royal Craftsmanship & Timeless Elegance",
    "heroSubtitle": "Handcrafted Organza Sarees, Designer Silk Kurtas, Bridal Lehengas & Artisanal Cosmetics.",
    "heroImageUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600",
    "announcementTicker": "🔥 FESTIVE OFFERS: Free Shipping across Nepal on orders above NPR 3,000! Use code WELCOME500",
    "promoBadge": "Festive Luxury Collection 2026",
    "ctaText": "Explore Collection",
    "banners": DEFAULT_BANNERS,
}

@router.get("/cms/homepage")
async def get_homepage_cms():
    """Fetch active homepage CMS banner content."""
    cms = await db.cms.find_one({"key": "homepage"})
    if not cms:
        return DEFAULT_CMS
    cms.pop("_id", None)
    cms.pop("key", None)
    if "banners" not in cms or not cms["banners"]:
        cms["banners"] = DEFAULT_BANNERS
    return cms

@router.patch("/admin/cms/homepage")
async def update_homepage_cms(inp: HomepageCMS, admin: dict = Depends(get_current_admin)):
    """Update homepage CMS banner content (Title, Subtitle, Images, Ticker, Banners)."""
    doc = inp.model_dump()
    doc["key"] = "homepage"
    await db.cms.update_one({"key": "homepage"}, {"$set": doc}, upsert=True)
    return {"message": "Homepage CMS updated successfully", "cms": doc}

