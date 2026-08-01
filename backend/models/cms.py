from pydantic import BaseModel
from typing import Optional

class BannerSlide(BaseModel):
    id: str
    title: str
    subtitle: str
    category: Optional[str] = "all"
    buttonText: Optional[str] = "SHOP NOW"
    image: str
    badge: Optional[str] = None

class HomepageCMS(BaseModel):
    heroTitle: str = "Embrace Royal Craftsmanship & Timeless Elegance"
    heroSubtitle: str = "Handcrafted Organza Sarees, Designer Silk Kurtas, Bridal Lehengas & Artisanal Cosmetics."
    heroImageUrl: str = "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1600"
    announcementTicker: str = "🔥 FESTIVE OFFERS: Free Shipping across Nepal on orders above NPR 3,000! Use code WELCOME500"
    promoBadge: str = "Festive Luxury Collection 2026"
    ctaText: str = "Explore Collection"
    banners: Optional[list[BannerSlide]] = None

