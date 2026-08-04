from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class ProductLogistics(BaseModel):
    """Per-product shipping & logistics configuration."""
    weight_value: float = Field(0.0, ge=0, description="Product weight numeric value")
    weight_unit: str = Field("gm", description="Weight unit: gm or kg")
    length_cm: float = Field(0.0, ge=0)
    width_cm: float = Field(0.0, ge=0)
    height_cm: float = Field(0.0, ge=0)
    packaging_type: str = Field("box", description="box, envelope, polybag")
    is_fragile: bool = False
    hs_code: Optional[str] = Field(None, description="Harmonized System code for customs")


class ProductReturnPolicy(BaseModel):
    """Per-product return & exchange policy."""
    is_returnable: bool = True
    return_window_days: int = Field(7, ge=0, le=90)
    exchange_only: bool = False
    conditions: str = Field("Unused with original tags intact", description="Return conditions text")
    non_returnable_reason: Optional[str] = None


class ProductDeliveryInfo(BaseModel):
    """Per-product delivery configuration."""
    estimated_days_min: int = Field(3, ge=1)
    estimated_days_max: int = Field(7, ge=1)
    express_eligible: bool = True
    cod_eligible: bool = True
    free_shipping_eligible: bool = True


class ProductCreate(BaseModel):
    name: str
    category: str
    brand: str
    price: float
    originalPrice: float
    # New products start with no ratings or reviews. Real ratings will be
    # accumulated via the review endpoints.
    rating: float = 0.0
    reviewsCount: int = 0
    image: str
    images: List[str] = Field(default_factory=list, description="Gallery photo URLs (up to 8)")
    sizes: List[str] = []
    colors: List[str] = []
    inStock: bool = True
    isFlashSale: bool = False
    isFeatured: bool = False
    isTrending: bool = False
    isBestSeller: bool = False
    isNewArrival: bool = True
    discountPercent: int = 20
    resellerMargin: float = 200
    description: str
    tags: List[str] = []
    sku: Optional[str] = None
    stock: int = Field(0, ge=0, description="Inventory quantity")

    # Existing optional fields
    fabric: Optional[str] = None
    work: Optional[str] = None
    shade: Optional[str] = None
    badge: Optional[str] = None

    # ── Category-specific attributes (dynamic per category) ──
    categorySpecs: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Category-specific attributes like weight_gm, volume_ml, skin_type, purity, etc."
    )

    # ── Logistics & Shipping ──
    logistics: Optional[ProductLogistics] = Field(default_factory=ProductLogistics)

    # ── Return & Exchange Policy ──
    returnPolicy: Optional[ProductReturnPolicy] = Field(default_factory=ProductReturnPolicy)

    # ── Delivery Info ──
    deliveryInfo: Optional[ProductDeliveryInfo] = Field(default_factory=ProductDeliveryInfo)


class ReviewCreate(BaseModel):
    userName: str
    userEmail: Optional[str] = None
    rating: int = 5
    fitRating: Optional[int] = 3  # 1=Runs Small, 3=True to Size, 5=Runs Large
    qualityRating: Optional[int] = 5  # 1-5 scale
    valueRating: Optional[int] = 5  # 1-5 scale
    title: Optional[str] = None
    comment: str
    photoUrl: Optional[str] = None
    photos: List[str] = []
    verifiedPurchase: Optional[bool] = None

class ReviewVote(BaseModel):
    voterId: Optional[str] = None

class AdminReviewReply(BaseModel):
    responseText: str
