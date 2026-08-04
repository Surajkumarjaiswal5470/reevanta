"""
CMS, Dynamic Pages & Content Pydantic Models
Covers Hero Slider, Announcement Bar, Static Pages (About, Contact, Privacy, Terms, Returns, Shipping), Blog Posts, FAQs, Careers, and Editorial Lookbooks.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict


class HeroSlideSchema(BaseModel):
    id: Optional[str] = Field(None, examples=["slide-001"])
    title: str = Field(..., min_length=2, max_length=150)
    subtitle: Optional[str] = ""
    category: Optional[str] = "sarees"
    buttonText: Optional[str] = "EXPLORE COLLECTION"
    buttonLink: Optional[str] = "/category/sarees"
    image: str = Field(...)
    badge: Optional[str] = "NEW ARRIVAL"
    slide_order: int = Field(1, ge=1)
    isActive: bool = True


class AnnouncementBarSchema(BaseModel):
    enabled: bool = True
    text: str = Field("✨ Complimentary Express Delivery Across Kathmandu & Worldwide Shipping Available!", max_length=200)
    link: Optional[str] = "/catalog"
    bgColor: str = Field("#5C1E1E")
    textColor: str = Field("#FAF5EC")


class CountdownTimerSchema(BaseModel):
    enabled: bool = True
    title: str = Field("⚡ ROYAL FESTIVE FLASH SALE", max_length=100)
    subtitle: Optional[str] = "Limited time heritage collection discounts ending soon."
    end_datetime: str = Field("2026-12-31T23:59:59Z")
    ctaText: Optional[str] = "SHOP FLASH DEALS"
    ctaLink: Optional[str] = "/catalog?is_flash_sale=true"
    bannerUrl: Optional[str] = ""


class PromoPopupSchema(BaseModel):
    enabled: bool = True
    title: str = Field("Enjoy 10% OFF Your First Royal Order", max_length=100)
    subtitle: Optional[str] = "Subscribe to our exclusive heritage VIP newsletter."
    imageUrl: Optional[str] = "https://images.unsplash.com/photo-1610030469983-98e550d6193c"
    discountCode: Optional[str] = "WELCOME10"
    delaySeconds: int = Field(5, ge=0, le=60)
    popupType: str = Field("NEWSLETTER", pattern="^(NEWSLETTER|DISCOUNT|EXIT_INTENT)$")


class SeasonalCampaignSchema(BaseModel):
    id: Optional[str] = None
    name: str = Field(..., examples=["Dashain & Tihar Festive Royale"])
    season: str = Field("Festive", examples=["Summer", "Winter", "Festive", "Diwali"])
    bannerUrl: str = Field(...)
    description: Optional[str] = ""
    startDate: Optional[str] = "2026-09-01"
    endDate: Optional[str] = "2026-11-15"
    isActive: bool = True


class PageSEOSchema(BaseModel):
    metaTitle: Optional[str] = ""
    metaDescription: Optional[str] = ""
    keywords: Optional[str] = ""


class CMSPageSchema(BaseModel):
    slug: str = Field(..., examples=["about-us", "privacy-policy"])
    title: str = Field(..., min_length=2, max_length=150)
    content: str = Field(...)
    seo: Optional[PageSEOSchema] = None
    is_published: bool = True


class BlogPostSchema(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., min_length=2, max_length=200)
    slug: str = Field(...)
    author: str = Field("Reevanta Heritage Editorial")
    category: str = Field("Bridal Fashion", examples=["Bridal Fashion", "Heritage Craft", "Care Guide"])
    featuredImage: str = Field(...)
    summary: Optional[str] = ""
    content: str = Field(...)
    tags: List[str] = Field(default_factory=list)
    isPublished: bool = True


class FAQItemSchema(BaseModel):
    id: Optional[str] = None
    category: str = Field("Orders & Shipping", examples=["Orders & Shipping", "Returns & Refunds", "Custom Tailoring"])
    question: str = Field(...)
    answer: str = Field(...)
    sort_order: int = Field(1, ge=1)


class CareerJobSchema(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., examples=["Senior Silk Designer & Textile Artisan"])
    department: str = Field("Design & Atelier")
    location: str = Field("Kathmandu Studio / Remote")
    type: str = Field("Full-Time")
    description: str = Field(...)
    requirements: Optional[str] = ""
    applyLink: Optional[str] = "mailto:careers@therivaanta.com"
    is_active: bool = True


class LookbookItemSchema(BaseModel):
    id: Optional[str] = None
    title: str = Field(..., examples=["Royal Kanjivaram Bridal Editorial 2026"])
    season: str = Field("Festive 2026")
    bannerUrl: str = Field(...)
    galleryImages: List[str] = Field(default_factory=list)
    taggedProductIds: List[str] = Field(default_factory=list)
    description: Optional[str] = ""
