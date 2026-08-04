"""
Shipping & Logistics Pydantic Models
Covers Shipping Zones, Methods, Delivery Rates, Courier Partners, Free Shipping Rules, COD Availability, and Tracking Integrations.
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict


class ShippingMethodSchema(BaseModel):
    method_id: str = Field(..., examples=["exp-ktm"])
    name: str = Field(..., examples=["Kathmandu Same-Day Express"])
    delivery_time_text: str = Field("Same Day (Within 12 Hours)", examples=["Same Day (Within 12 Hours)"])
    base_charge: float = Field(100.0, ge=0)
    courier_partner: str = Field("Nepal Express", examples=["Nepal Express"])
    weight_charge_per_kg: float = Field(0.0, ge=0)
    cod_fee: float = Field(0.0, ge=0)
    is_active: bool = True


class ShippingZoneCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, examples=["Kathmandu Valley Express Zone"])
    code: str = Field(..., examples=["KTM_VALLEY"])
    regions: List[str] = Field(default_factory=lambda: ["Kathmandu", "Lalitpur", "Bhaktapur"])
    methods: List[ShippingMethodSchema] = Field(default_factory=list)
    free_shipping_threshold: float = Field(1499.0, ge=0)
    cod_available: bool = True
    is_active: bool = True
    sort_order: int = Field(1, ge=1)


class ShippingZoneUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    regions: Optional[List[str]] = None
    methods: Optional[List[ShippingMethodSchema]] = None
    free_shipping_threshold: Optional[float] = None
    cod_available: Optional[bool] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class CourierPartnerSchema(BaseModel):
    name: str = Field(..., examples=["DHL Express"])
    logo_url: Optional[str] = ""
    tracking_url_template: str = Field("https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}")
    api_key: Optional[str] = ""
    is_active: bool = True


class CalculateShippingRequest(BaseModel):
    destination_city: Optional[str] = "Kathmandu"
    destination_country: Optional[str] = "Nepal"
    cart_total: float = Field(..., ge=0)
    total_weight_kg: float = Field(1.0, ge=0)
