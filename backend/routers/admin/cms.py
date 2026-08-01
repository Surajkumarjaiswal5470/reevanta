from fastapi import APIRouter, Depends, HTTPException
from core.database import db, serialize_doc
from core.security import get_current_admin
from models.cms import HomepageCMS

router = APIRouter(prefix="", tags=["CMS - Content Management"])

DEFAULT_BANNERS = [
    {
        "id": "slide-cosmetics",
        "title": "Artisanal Velvet Cosmetics",
        "subtitle": "Dewy finish, velvet lips & subtle gold sparkle ritual.",
        "category": "cosmetics",
        "buttonText": "EXPLORE COSMETICS",
        "image": "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80",
        "badge": "OFFICIAL LAUNCH 2026",
    },
    {
        "id": "slide-serum",
        "title": "Vitamin C 15% Face Serum",
        "subtitle": "Brightening & hydrating serum with pure hyaluronic acid for instant radiance.",
        "category": "beauty",
        "buttonText": "SHOP SKINCARE",
        "image": "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=1200&q=80",
        "badge": "BEST SELLER • SKINCARE",
    },
    {
        "id": "slide-palette",
        "title": "Rose Gold Eyeshadow Palette",
        "subtitle": "12 royal heritage matte & shimmer shades for day and evening glamour.",
        "category": "cosmetics",
        "buttonText": "SHOP PALETTES",
        "image": "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80",
        "badge": "NEW ARRIVAL • LUXURY MAKEUP",
    },
    {
        "id": "slide-lipliner",
        "title": "Rose Lip Liner Collection",
        "subtitle": "Creamy, long-wear lip liners crafted for flawless contouring and definition.",
        "category": "cosmetics",
        "buttonText": "EXPLORE LIP CARE",
        "image": "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&w=1200&q=80",
        "badge": "LIP CARE ESSENTIAL",
    },
    {
        "id": "slide-fixer",
        "title": "16-Hour Makeup Setting Mist",
        "subtitle": "Weightless 16-hour makeup fixing mist infused with hyaluronic acid.",
        "category": "cosmetics",
        "buttonText": "SHOP FIXER MIST",
        "image": "https://images.unsplash.com/photo-1631214540242-3cd8c4b0b3b6?auto=format&fit=crop&w=1200&q=80",
        "badge": "BEAUTY ESSENTIAL",
    },
    {
        "id": "slide-toner",
        "title": "Rose Gold Face Toner Mist",
        "subtitle": "Alcohol-free botanical rose water & 24K gold toner to soothe and hydrate.",
        "category": "beauty",
        "buttonText": "SHOP TONER MIST",
        "image": "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?auto=format&fit=crop&w=1200&q=80",
        "badge": "ORGANIC BEAUTY",
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
    """Fetch active homepage CMS banner content with fallback."""
    try:
        cms = await db.cms.find_one({"key": "homepage"})
        if cms:
            cms.pop("_id", None)
            cms.pop("key", None)
            if "banners" not in cms or not cms["banners"]:
                cms["banners"] = DEFAULT_BANNERS
            return cms
    except Exception:
        pass
    return DEFAULT_CMS


@router.patch("/admin/cms/homepage")
async def update_homepage_cms(inp: HomepageCMS, admin: dict = Depends(get_current_admin)):
    """Update homepage CMS banner content (Title, Subtitle, Images, Ticker, Banners)."""
    doc = inp.model_dump()
    doc["key"] = "homepage"
    await db.cms.update_one({"key": "homepage"}, {"$set": doc}, upsert=True)
    return {"message": "Homepage CMS updated successfully", "cms": doc}

