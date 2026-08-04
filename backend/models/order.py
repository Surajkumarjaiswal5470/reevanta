"""
Order Pydantic Schemas
Covers Order Creation, Editing, Split Shipments, Tracking Numbers, Gift Orders, Audit Timelines, and Returns.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict


class OrderItem(BaseModel):
    productId: Optional[str] = None
    name: str
    price: float
    qty: int
    image: Optional[str] = ""
    selectedSize: Optional[str] = ""
    selectedColor: Optional[str] = ""


class OrderCreate(BaseModel):
    items: List[OrderItem]
    subtotal: float
    shipping: float = 0
    total: float
    address: dict
    paymentMethod: str = "COD"
    notes: Optional[str] = ""
    isGift: Optional[bool] = False
    giftMessage: Optional[str] = ""


class OrderEditSchema(BaseModel):
    items: Optional[List[OrderItem]] = None
    shippingAddress: Optional[dict] = None
    phone: Optional[str] = None
    notes: Optional[str] = None
    total: Optional[float] = None


class StatusUpdate(BaseModel):
    status: str
    notes: Optional[str] = ""
    actor: Optional[str] = "Admin Staff"


class TrackingUpdate(BaseModel):
    courier: str = Field(..., examples=["Nepal Express"])
    trackingNumber: str = Field(..., examples=["TRK-NEP-887766"])
    trackingUrl: Optional[str] = ""


class ShipmentPackage(BaseModel):
    shipment_id: Optional[str] = Field(None, examples=["PKG-001"])
    items: List[OrderItem]
    courier: str = Field("Nepal Express")
    tracking_number: str = Field(...)
    tracking_url: Optional[str] = ""
    shipped_at: Optional[str] = None
    status: str = "Shipped"


class GiftOrderMeta(BaseModel):
    is_gift: bool = True
    gift_message: Optional[str] = ""
    gift_wrap: bool = True
    hide_prices_on_packing_slip: bool = True


class TimelineEvent(BaseModel):
    timestamp: str
    actor: str = "System"
    action: str
    old_status: Optional[str] = None
    new_status: Optional[str] = None
    notes: Optional[str] = ""


class BankAccountDetails(BaseModel):
    accountHolderName: Optional[str] = ""
    bankName: Optional[str] = ""
    accountNumber: Optional[str] = ""
    branchOrIfsc: Optional[str] = ""


class WalletDetails(BaseModel):
    walletType: Optional[str] = ""
    walletNumberOrId: Optional[str] = ""


class ReturnItemRequest(BaseModel):
    reason: str
    reasonDetails: Optional[str] = ""
    proofImage: Optional[str] = ""
    selectedItems: Optional[List[Dict[str, Any]]] = []
    refundMethod: str = "bank_account"
    bankDetails: Optional[BankAccountDetails] = None
    walletDetails: Optional[WalletDetails] = None
    pickupAddress: Optional[Dict[str, Any]] = None


class ReturnStatusUpdate(BaseModel):
    returnStatus: str
    notes: Optional[str] = ""
