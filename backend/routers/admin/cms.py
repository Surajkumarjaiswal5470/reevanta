"""
Admin & Public CMS Content Router
Handles Homepage Builder, Static & Legal Policy Pages (About Us, Contact Us, Privacy, Terms, Returns, Shipping), Blogs, FAQs, Careers, and Editorial Lookbooks.
"""

from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_admin
from models.cms import (
    HeroSlideSchema, AnnouncementBarSchema, CountdownTimerSchema,
    PromoPopupSchema, SeasonalCampaignSchema, CMSPageSchema,
    BlogPostSchema, FAQItemSchema, CareerJobSchema, LookbookItemSchema
)

router = APIRouter(prefix="", tags=["CMS - Content Management"])

# ──────────────────── DEFAULT PRE-SEEDED CONTENT ────────────────────

DEFAULT_PAGES = {
    "about-us": {
        "slug": "about-us",
        "title": "About Reevanta — Royal Heritage Craftsmanship",
        "content": "Reevanta is a premier luxury heritage fashion atelier originating in Nepal, dedicated to handwoven royal Kanjivaram silk sarees, intricate Zardozi bridal lehengas, and handcrafted Kundan fine jewelry. Each garment is meticulously woven by master textile artisans preserving century-old royal techniques.",
        "seo": {"metaTitle": "About Reevanta | Royal Heritage Silk & Bridal Fashion", "metaDescription": "Discover the story of Reevanta luxury heritage sarees and bridal craft.", "keywords": "Reevanta, heritage silk, Kanjivaram saree, bridal lehenga"},
        "is_published": True
    },
    "contact-us": {
        "slug": "contact-us",
        "title": "Contact Reevanta Concierge & Atelier Studios",
        "content": "Flagship Studio: Durbar Marg, Kathmandu, Nepal.\nCustomer Care: +977-1-4200000 | Email: concierge@therivaanta.com\nStudio Hours: Mon – Sat: 10:00 AM – 7:30 PM",
        "seo": {"metaTitle": "Contact Reevanta | Atelier Studio & Customer Concierge", "metaDescription": "Get in touch with Reevanta customer concierge or visit our flagship studio in Kathmandu.", "keywords": "Reevanta contact, Kathmandu atelier, customer care"},
        "is_published": True
    },
    "privacy-policy": {
        "slug": "privacy-policy",
        "title": "Privacy Policy & Data Security",
        "content": "At Reevanta, protecting customer privacy and personal data is paramount. We employ 256-bit SSL encryption for all transactions. We do not sell or share customer data with third parties.",
        "seo": {"metaTitle": "Privacy Policy | Reevanta Luxury Atelier", "metaDescription": "Learn how Reevanta protects customer personal information and transaction privacy.", "keywords": "Reevanta privacy policy, data security"},
        "is_published": True
    },
    "terms-and-conditions": {
        "slug": "terms-and-conditions",
        "title": "Terms & Conditions of Service",
        "content": "Welcome to Reevanta. By accessing our platform or placing an order, you agree to our terms of service. All designs, images, and brand trademarks are exclusive intellectual property of Reevanta Atelier.",
        "seo": {"metaTitle": "Terms & Conditions | Reevanta Luxury Atelier", "metaDescription": "Official terms of service for purchasing at Reevanta.", "keywords": "Reevanta terms, terms of service"},
        "is_published": True
    },
    "return-policy": {
        "slug": "return-policy",
        "title": "Return & Refund Policy",
        "content": "We offer a 7-day hassle-free return and exchange policy for unused items in original packaging with intact security tags. Refunds are processed to your original payment method, bank account, or eSewa wallet within 3 business days of inspection approval.",
        "seo": {"metaTitle": "Return & Refund Policy | Reevanta", "metaDescription": "7-day return policy and doorstep pickup information.", "keywords": "Reevanta returns, refund policy"},
        "is_published": True
    },
    "shipping-policy": {
        "slug": "shipping-policy",
        "title": "Shipping & Express Delivery Policy",
        "content": "We offer complimentary express delivery across Kathmandu Valley on orders above ₹1,499. National shipping across Nepal arrives in 2–4 days. Worldwide international shipping is fulfilled via DHL Express Air.",
        "seo": {"metaTitle": "Shipping & Delivery Policy | Reevanta", "metaDescription": "Worldwide express delivery and shipping guidelines.", "keywords": "Reevanta shipping, express delivery"},
        "is_published": True
    }
}

DEFAULT_FAQS = [
    {
        "category": "Orders & Shipping",
        "question": "How long does delivery take for orders in Kathmandu?",
        "answer": "Orders placed within Kathmandu Valley are delivered Same-Day or within 1–2 business days via our express courier team.",
        "sort_order": 1
    },
    {
        "category": "Orders & Shipping",
        "question": "Do you ship internationally outside Nepal?",
        "answer": "Yes, we ship globally to India, SAARC countries, USA, UK, Australia, and worldwide via DHL Express Air.",
        "sort_order": 2
    },
    {
        "category": "Returns & Refunds",
        "question": "What is the return policy duration?",
        "answer": "You can request a return or size exchange within 7 days of order receipt provided security tags are intact.",
        "sort_order": 3
    },
    {
        "category": "Custom Tailoring",
        "question": "Can I get custom blouse stitching or saree picofall fitting?",
        "answer": "Yes, we offer custom designer blouse stitching and saree fall/edging finishing upon request during checkout.",
        "sort_order": 4
    }
]

DEFAULT_BLOGS = [
    {
        "title": "The Secrets of Handwoven Kanjivaram Silk Sarees",
        "slug": "secrets-of-handwoven-kanjivaram-silk",
        "author": "Reevanta Heritage Editorial",
        "category": "Heritage Craft",
        "featuredImage": "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
        "summary": "Discover how master weavers craft 100% pure Mulberry silk sarees with real gold Zari thread.",
        "content": "Kanjivaram silk sarees represent the pinnacle of South Asian royal textile heritage. Handcrafted with three ply silk yarn and pure silver dipped gold Zari thread, each saree takes over 300 weaver hours to complete.",
        "tags": ["Kanjivaram", "Silk Saree", "Bridal", "Heritage Craft"],
        "isPublished": True,
        "publishedAt": "2026-08-01T10:00:00Z"
    }
]

DEFAULT_LOOKBOOK = [
    {
        "title": "Royal Festive & Bridal Editorial 2026",
        "season": "Festive 2026",
        "bannerUrl": "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
        "galleryImages": [
            "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
            "https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b",
            "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908"
        ],
        "description": "An opulent showcase of handcrafted royal bridal lehengas, silk sarees, and Kundan jewelry."
    }
]


# ──────────────────── PUBLIC ENDPOINTS ────────────────────

@router.get("/cms/homepage")
async def get_homepage_cms():
    """Public endpoint to fetch structured homepage CMS data."""
    doc = await db.cms.find_one({"type": "homepage"})
    if not doc:
        return {
            "hero_slides": [],
            "announcement_bar": {"enabled": True, "text": "✨ Complimentary Delivery Across Kathmandu!", "bgColor": "#5C1E1E", "textColor": "#FAF5EC"},
            "countdown_timer": {"enabled": True, "title": "⚡ ROYAL FESTIVE FLASH SALE", "end_datetime": "2026-12-31T23:59:59Z"},
            "promo_popup": {"enabled": True, "title": "Enjoy 10% OFF Your First Order", "discountCode": "WELCOME10"},
            "seasonal_campaigns": []
        }
    serialized = serialize_doc(doc)
    serialized.pop("_id", None)
    serialized.pop("type", None)
    return serialized


@router.get("/cms/pages/{slug}")
async def get_public_cms_page(slug: str):
    """Public endpoint returning dynamic page content (About Us, Contact Us, Legal Policies)."""
    page = await db.cms_pages.find_one({"slug": slug, "is_published": True})
    if not page:
        if slug in DEFAULT_PAGES:
            return DEFAULT_PAGES[slug]
        raise HTTPException(status_code=404, detail="Page not found")
    return serialize_doc(page)


@router.get("/cms/blogs")
async def list_public_blogs():
    """Fetch published blog articles."""
    blogs = await db.cms_blogs.find({"isPublished": True}).sort("publishedAt", -1).to_list(50)
    if not blogs:
        return DEFAULT_BLOGS
    return [serialize_doc(b) for b in blogs]


@router.get("/cms/blogs/{slug}")
async def get_public_blog_by_slug(slug: str):
    """Fetch single published blog post by slug."""
    blog = await db.cms_blogs.find_one({"slug": slug, "isPublished": True})
    if not blog:
        for b in DEFAULT_BLOGS:
            if b["slug"] == slug:
                return b
        raise HTTPException(status_code=404, detail="Blog post not found")
    return serialize_doc(blog)


@router.get("/cms/faqs")
async def list_public_faqs():
    """Fetch categorized FAQs."""
    faqs = await db.cms_faqs.find({}).sort("sort_order", 1).to_list(100)
    if not faqs:
        return DEFAULT_FAQS
    return [serialize_doc(f) for f in faqs]


@router.get("/cms/careers")
async def list_public_careers():
    """Fetch active career job openings."""
    jobs = await db.cms_careers.find({"is_active": True}).to_list(50)
    return [serialize_doc(j) for j in jobs]


@router.get("/cms/lookbook")
async def list_public_lookbook():
    """Fetch editorial lookbook galleries."""
    lookbooks = await db.cms_lookbook.find({}).to_list(50)
    if not lookbooks:
        return DEFAULT_LOOKBOOK
    return [serialize_doc(l) for l in lookbooks]


# ──────────────────── ADMIN ENDPOINTS ────────────────────

@router.get("/admin/cms/pages")
async def list_admin_pages(admin: dict = Depends(get_current_admin)):
    """List all static & legal policy pages for admin editor."""
    pages = await db.cms_pages.find({}).to_list(100)
    if not pages:
        seeded = []
        try:
            for slug, p in DEFAULT_PAGES.items():
                p_copy = dict(p)
                p_copy["updated_at"] = datetime.now(timezone.utc).isoformat()
                res = await db.cms_pages.insert_one(p_copy)
                p_copy["id"] = str(res.inserted_id)
                p_copy.pop("_id", None)
                seeded.append(p_copy)
            return seeded
        except Exception:
            return list(DEFAULT_PAGES.values())
    return [serialize_doc(p) for p in pages]


@router.put("/admin/cms/pages/{slug}")
async def update_admin_page(slug: str, inp: CMSPageSchema, admin: dict = Depends(get_current_admin)):
    """Create or update dynamic page content and SEO tags."""
    doc = inp.model_dump()
    doc["slug"] = slug
    doc["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db.cms_pages.update_one(
        {"slug": slug},
        {"$set": doc},
        upsert=True
    )
    return {"message": f"Page '{slug}' updated successfully", "page": doc}


@router.get("/admin/cms/blogs")
async def list_admin_blogs(admin: dict = Depends(get_current_admin)):
    """Fetch all blog posts for admin publisher."""
    blogs = await db.cms_blogs.find({}).sort("created_at", -1).to_list(100)
    if not blogs:
        return DEFAULT_BLOGS
    return [serialize_doc(b) for b in blogs]


@router.post("/admin/cms/blogs")
async def create_admin_blog(inp: BlogPostSchema, admin: dict = Depends(get_current_admin)):
    """Publish or update a blog post."""
    doc = inp.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.cms_blogs.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@router.delete("/admin/cms/blogs/{blog_id}")
async def delete_admin_blog(blog_id: str, admin: dict = Depends(get_current_admin)):
    """Delete a blog post."""
    res = await db.cms_blogs.delete_one({"_id": to_object_id(blog_id)})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Blog post not found")
    return {"message": "Blog post deleted successfully"}


@router.get("/admin/cms/faqs")
async def list_admin_faqs(admin: dict = Depends(get_current_admin)):
    """Fetch all FAQs for admin editor."""
    faqs = await db.cms_faqs.find({}).sort("sort_order", 1).to_list(100)
    if not faqs:
        return DEFAULT_FAQS
    return [serialize_doc(f) for f in faqs]


@router.post("/admin/cms/faqs")
async def create_admin_faq(inp: FAQItemSchema, admin: dict = Depends(get_current_admin)):
    """Create or update FAQ item."""
    doc = inp.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.cms_faqs.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@router.get("/admin/cms/careers")
async def list_admin_careers(admin: dict = Depends(get_current_admin)):
    """Fetch all career listings for admin board."""
    jobs = await db.cms_careers.find({}).to_list(100)
    return [serialize_doc(j) for j in jobs]


@router.post("/admin/cms/careers")
async def create_admin_career(inp: CareerJobSchema, admin: dict = Depends(get_current_admin)):
    """Create a new job posting."""
    doc = inp.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.cms_careers.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@router.get("/admin/cms/lookbook")
async def list_admin_lookbooks(admin: dict = Depends(get_current_admin)):
    """Fetch all editorial lookbooks for admin editor."""
    lookbooks = await db.cms_lookbook.find({}).to_list(100)
    if not lookbooks:
        return DEFAULT_LOOKBOOK
    return [serialize_doc(l) for l in lookbooks]


@router.post("/admin/cms/lookbook")
async def create_admin_lookbook(inp: LookbookItemSchema, admin: dict = Depends(get_current_admin)):
    """Create or update an editorial lookbook gallery."""
    doc = inp.model_dump()
    doc["created_at"] = datetime.now(timezone.utc).isoformat()

    res = await db.cms_lookbook.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc
