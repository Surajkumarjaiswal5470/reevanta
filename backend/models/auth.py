from pydantic import BaseModel
from typing import Optional

class UserRegister(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str
    name: str

class UserLogin(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

class AdminSecretLoginRequest(BaseModel):
    name: str
    secretKey: str

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = ""

class SendEmailOTPRequest(BaseModel):
    email: str
