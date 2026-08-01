from pydantic import BaseModel
from typing import List, Optional

class CartItemModel(BaseModel):
    id: str
    name: str
    price: float
    qty: int = 1
    image: Optional[str] = None
    selectedSize: Optional[str] = None
    selectedColor: Optional[str] = None

class CartSyncRequest(BaseModel):
    items: List[CartItemModel]

class ShippingEstimateRequest(BaseModel):
    city: str = "Kathmandu"
    district: Optional[str] = None
    cartSubtotal: float = 0.0
