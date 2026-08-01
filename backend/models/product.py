from pydantic import BaseModel
from typing import List, Optional

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

