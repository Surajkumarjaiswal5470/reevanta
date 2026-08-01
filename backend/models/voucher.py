from pydantic import BaseModel
from typing import Optional

class VoucherCreate(BaseModel):
    code: str
    discountType: str = "fixed" # "fixed", "percentage", "bogo", "bundle"
    discountValue: float = 0.0
    minOrderValue: float = 0.0
    maxDiscount: Optional[float] = None
    maxUses: int = 500
    currentUses: int = 0
    autoApply: bool = False
    isActive: bool = True
    assignedCustomerEmail: Optional[str] = None
    description: Optional[str] = ""
    expiryDate: Optional[str] = "2026-12-31"

class VoucherApplyRequest(BaseModel):
    code: str
    cartTotal: float
    customerEmail: Optional[str] = None
