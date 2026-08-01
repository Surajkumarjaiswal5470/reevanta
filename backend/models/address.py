from pydantic import BaseModel
from typing import Optional

class AddressCreate(BaseModel):
    label: str = "Home"
    fullName: str
    phone: str
    line1: str
    line2: Optional[str] = ""
    city: str
    state: Optional[str] = ""
    pincode: str
    country: str = "India"
    lat: Optional[float] = None
    lng: Optional[float] = None
    isDefault: bool = False
