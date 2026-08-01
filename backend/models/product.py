from pydantic import BaseModel
from typing import List, Optional

class ProductCreate(BaseModel):
    name: str
    category: str
    brand: str
    price: float
    originalPrice: float
    rating: float = 4.5
    reviewsCount: int = 10
    image: str
    sizes: List[str]
    colors: List[str]
    inStock: bool = True
    isFlashSale: bool = False
    discountPercent: int = 20
    resellerMargin: float = 200
    description: str
    tags: List[str] = []
    fabric: Optional[str] = None
    work: Optional[str] = None
    shade: Optional[str] = None
    badge: Optional[str] = None

class ReviewCreate(BaseModel):
    userName: str
    rating: int = 5
    comment: str
    photoUrl: Optional[str] = None
    verifiedPurchase: bool = True
