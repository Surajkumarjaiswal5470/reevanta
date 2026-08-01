from pydantic import BaseModel
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

class StatusUpdate(BaseModel):
    status: str

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
    refundMethod: str = "bank_account" # bank_account, digital_wallet, original_payment
    bankDetails: Optional[BankAccountDetails] = None
    walletDetails: Optional[WalletDetails] = None
    pickupAddress: Optional[Dict[str, Any]] = None

class ReturnStatusUpdate(BaseModel):
    returnStatus: str
    notes: Optional[str] = ""
