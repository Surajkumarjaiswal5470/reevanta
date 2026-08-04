"""
Enterprise Product Catalog & Attribute Pydantic Models
Covers Brands, Collections, Attributes, Multi-SKU Variants, 360° Images, SEO Fields, and Status Badges.
"""

from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum


# ──────────────────── Enums ────────────────────

class ProductStatus(str, Enum):
    PUBLISHED = "published"
    DRAFT = "draft"
    ARCHIVED = "archived"


class SeasonType(str, Enum):
    SUMMER = "Summer"
    WINTER = "Winter"
    FESTIVE = "Festive"
    NEW_ARRIVAL = "New Arrival"
    ALL_SEASON = "All-Season"


class GenderType(str, Enum):
    WOMEN = "Women"
    MEN = "Men"
    UNISEX = "Unisex"
    KIDS = "Kids"


class FitType(str, Enum):
    RUNS_SMALL = "Runs Small"
    TRUE_TO_SIZE = "True to Size"
    RUNS_LARGE = "Runs Large"
    REGULAR = "Regular"
    SLIM = "Slim"
    OVERSIZED = "Oversized"


# ──────────────────── Brand & Collection Models ────────────────────

class BrandSEO(BaseModel):
    metaTitle: Optional[str] = Field(None, max_length=120)
    metaDescription: Optional[str] = Field(None, max_length=300)
    metaKeywords: List[str] = Field(default_factory=list)
    canonicalUrl: Optional[str] = None


class BrandCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["RIVAANTA Luxe"])
    slug: Optional[str] = Field(None, examples=["rivaanta-luxe"])
    logoUrl: Optional[str] = ""
    bannerUrl: Optional[str] = ""
    description: Optional[str] = ""
    website: Optional[str] = ""
    establishedYear: Optional[int] = Field(None, ge=1800, le=2100)
    originCountry: Optional[str] = "Nepal"
    featured: bool = False
    sort_order: int = Field(1, ge=0)
    seo: Optional[BrandSEO] = Field(default_factory=BrandSEO)


class BrandUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    logoUrl: Optional[str] = None
    bannerUrl: Optional[str] = None
    description: Optional[str] = None
    website: Optional[str] = None
    establishedYear: Optional[int] = None
    originCountry: Optional[str] = None
    featured: Optional[bool] = None
    sort_order: Optional[int] = None
    seo: Optional[BrandSEO] = None


class CollectionCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["Summer Silk 2026"])
    slug: Optional[str] = Field(None, examples=["summer-silk-2026"])
    season: SeasonType = SeasonType.SUMMER
    bannerUrl: Optional[str] = ""
    description: Optional[str] = ""
    featured: bool = False


class CollectionUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    season: Optional[SeasonType] = None
    bannerUrl: Optional[str] = None
    description: Optional[str] = None
    featured: Optional[bool] = None


# ──────────────────── Attributes & SKU Variants ────────────────────

class ColorSwatch(BaseModel):
    name: str = Field(..., examples=["Royal Maroon"])
    hex: str = Field("#5C1E1E", examples=["#5C1E1E"])


class ProductVariant(BaseModel):
    sku: str = Field(..., examples=["RV-SKU-SR-001-S"])
    size: Optional[str] = Field("Free Size", examples=["S"])
    color: Optional[str] = Field("Maroon", examples=["Maroon"])
    colorHex: Optional[str] = Field("#5C1E1E", examples=["#5C1E1E"])
    material: Optional[str] = Field("Silk", examples=["Silk"])
    fit: Optional[FitType] = FitType.TRUE_TO_SIZE
    stock: int = Field(10, ge=0)
    price_override: Optional[float] = None
    imageUrl: Optional[str] = None


class ProductSEO(BaseModel):
    metaTitle: Optional[str] = Field(None, max_length=120)
    metaDescription: Optional[str] = Field(None, max_length=300)
    metaKeywords: List[str] = Field(default_factory=list)
    canonicalUrl: Optional[str] = None


class ProductAttributes(BaseModel):
    material: Optional[str] = "Silk"
    fit: Optional[FitType] = FitType.TRUE_TO_SIZE
    gender: Optional[GenderType] = GenderType.WOMEN
    sizes: List[str] = Field(default_factory=lambda: ["S", "M", "L", "XL"])
    colors: List[ColorSwatch] = Field(default_factory=list)


# ──────────────────── Enterprise Product Model ────────────────────

class EnterpriseProductCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=200)
    slug: Optional[str] = None
    category: str = Field("sarees")
    brand: str = Field("RIVAANTA")
    brand_id: Optional[str] = None
    collection: Optional[str] = "New Arrival"
    collection_id: Optional[str] = None
    sku: Optional[str] = None

    price: float = Field(..., ge=0)
    originalPrice: float = Field(..., ge=0)
    discountPercent: int = Field(20, ge=0, le=100)
    resellerMargin: float = Field(200, ge=0)

    image: str = Field(...)
    images: List[str] = Field(default_factory=list)
    images_360: List[str] = Field(default_factory=list)

    description: str = Field(...)
    tags: List[str] = Field(default_factory=list)

    attributes: Optional[ProductAttributes] = Field(default_factory=ProductAttributes)
    variants: List[ProductVariant] = Field(default_factory=list)
    seo: Optional[ProductSEO] = Field(default_factory=ProductSEO)

    # Status & Badging Flags
    status: ProductStatus = ProductStatus.PUBLISHED
    inStock: bool = True
    isFlashSale: bool = False
    isFeatured: bool = False
    isTrending: bool = False
    isBestSeller: bool = False
    isNewArrival: bool = True


class EnterpriseProductUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    brand_id: Optional[str] = None
    collection: Optional[str] = None
    collection_id: Optional[str] = None
    sku: Optional[str] = None

    price: Optional[float] = None
    originalPrice: Optional[float] = None
    discountPercent: Optional[int] = None
    resellerMargin: Optional[float] = None

    image: Optional[str] = None
    images: Optional[List[str]] = None
    images_360: Optional[List[str]] = None

    description: Optional[str] = None
    tags: Optional[List[str]] = None

    attributes: Optional[ProductAttributes] = None
    variants: Optional[List[ProductVariant]] = None
    seo: Optional[ProductSEO] = None

    status: Optional[ProductStatus] = None
    inStock: Optional[bool] = None
    isFlashSale: Optional[bool] = None
    isFeatured: Optional[bool] = None
    isTrending: Optional[bool] = None
    isBestSeller: Optional[bool] = None
    isNewArrival: Optional[bool] = None
