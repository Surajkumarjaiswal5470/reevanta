"""
Voucher & Coupon Pydantic Models
Covers Percentage, Fixed Amount, Buy X Get Y (BXGY), Flash Sales, Category/Brand Discounts, Free Shipping, Referral Codes, and Analytics.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class VoucherCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=50, examples=["ROYAL20"])
    discountType: str = Field("percentage", examples=["percentage", "fixed", "buy_x_get_y", "bundle", "flash_sale", "category", "brand", "free_shipping", "referral"])
    discountValue: float = Field(0.0, ge=0)
    minOrderValue: float = Field(0.0, ge=0)
    maxDiscount: Optional[float] = None
    maxUses: int = Field(500, ge=1)
    currentUses: int = Field(0, ge=0)
    autoApply: bool = False
    isActive: bool = True

    # Targeted & Complex Rules
    targetCategory: Optional[str] = None
    targetBrand: Optional[str] = None
    buyQty: Optional[int] = Field(1, ge=1)
    getQty: Optional[int] = Field(1, ge=1)
    bundleProductIds: List[str] = Field(default_factory=list)
    freeShipping: bool = False
    referralUserEmail: Optional[str] = None
    flashSaleStart: Optional[str] = None
    flashSaleEnd: Optional[str] = None

    assignedCustomerEmail: Optional[str] = None
    description: Optional[str] = ""
    expiryDate: Optional[str] = "2026-12-31"


class VoucherUpdate(BaseModel):
    code: Optional[str] = None
    discountType: Optional[str] = None
    discountValue: Optional[float] = None
    minOrderValue: Optional[float] = None
    maxDiscount: Optional[float] = None
    maxUses: Optional[int] = None
    currentUses: Optional[int] = None
    autoApply: Optional[bool] = None
    isActive: Optional[bool] = None

    targetCategory: Optional[str] = None
    targetBrand: Optional[str] = None
    buyQty: Optional[int] = None
    getQty: Optional[int] = None
    bundleProductIds: Optional[List[str]] = None
    freeShipping: Optional[bool] = None
    referralUserEmail: Optional[str] = None
    flashSaleStart: Optional[str] = None
    flashSaleEnd: Optional[str] = None

    assignedCustomerEmail: Optional[str] = None
    description: Optional[str] = None
    expiryDate: Optional[str] = None


class CartItemSchema(BaseModel):
    productId: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    price: float
    qty: int = 1


class VoucherApplyRequest(BaseModel):
    code: str
    cartTotal: float
    items: List[CartItemSchema] = Field(default_factory=list)
    customerEmail: Optional[str] = None
