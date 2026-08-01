from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from core.database import db, serialize_doc, to_object_id
from core.security import get_current_user, get_current_user_or_none

router = APIRouter(prefix="/support", tags=["Customer Support"])

class ContactSubmission(BaseModel):
    name: str
    email: str | None = None
    phone: str | None = None
    subject: str = "General Inquiry"
    message: str

class TicketCreate(BaseModel):
    order_id: str | None = None
    category: str = Field(..., examples=["Order Status", "Return Request", "Payment Issue", "Product Sizing", "Other"])
    subject: str
    description: str
    priority: str = "Normal"

@router.post("/contact")
async def submit_contact_form(inp: ContactSubmission, request: Request):
    """Submit a general contact query."""
    user = await get_current_user_or_none(request)
    doc = inp.model_dump()
    doc["user_id"] = user["id"] if user else None
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["status"] = "Open"
    
    try:
        res = await db.support_contact.insert_one(doc)
        doc["id"] = str(res.inserted_id)
        doc.pop("_id", None)
    except Exception:
        doc["id"] = "TICK-LOCAL-101"

    return {"message": "Contact message received successfully", "ticket_id": doc["id"]}

@router.post("/tickets")
async def create_support_ticket(inp: TicketCreate, user: dict = Depends(get_current_user)):
    """Raise a support ticket."""
    doc = inp.model_dump()
    try:
        ticket_seq = await db.support_tickets.count_documents({}) + 1001
    except Exception:
        ticket_seq = 1001
    
    doc["ticket_number"] = f"TICK-{ticket_seq}"
    doc["user_id"] = user["id"]
    doc["user_name"] = user.get("name", "Customer")
    doc["user_email"] = user.get("email")
    doc["user_phone"] = user.get("phone")
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    doc["status"] = "Open"
    doc["responses"] = []

    try:
        res = await db.support_tickets.insert_one(doc)
        doc["id"] = str(res.inserted_id)
        doc.pop("_id", None)
    except Exception:
        doc["id"] = f"LOCAL-{ticket_seq}"

    return doc

@router.get("/tickets/mine")
async def get_my_support_tickets(user: dict = Depends(get_current_user)):
    """Fetch user's raised support tickets."""
    try:
        tickets = await db.support_tickets.find({"user_id": user["id"]}).sort("created_at", -1).to_list(100)
    except Exception:
        tickets = []
    return [serialize_doc(t) for t in tickets]

@router.get("/faqs")
async def get_faqs():
    """Fetch active FAQ list."""
    return [
        {
            "category": "Shipping & Delivery",
            "question": "How long does delivery take across Nepal?",
            "answer": "Delivery within Kathmandu Valley takes 24 hours. Delivery to major cities (Pokhara, Biratnagar, Chitwan, Butwal) takes 2-3 business days. Regional courier delivery takes 3-5 days."
        },
        {
            "category": "Shipping & Delivery",
            "question": "Is Free Shipping available?",
            "answer": "Yes! FREE Shipping is automatically applied on all orders above NPR 3,000 or any address within Kathmandu Valley."
        },
        {
            "category": "Returns & Refunds",
            "question": "What is the return policy?",
            "answer": "We offer a 7-day hassle-free doorstep return policy for unworn apparel with tags intact. Refunds are credited via eSewa, Khalti, or direct Bank Transfer."
        },
        {
            "category": "Products & Sizing",
            "question": "Are the ethnic sarees and kurtas authentic?",
            "answer": "100% authentic. All sarees, silk kurtas, and lehengas are handcrafted by master artisans with genuine zardosi, organza, and Kundan craftsmanship."
        },
        {
            "category": "Payments",
            "question": "What payment methods are supported?",
            "answer": "We accept Cash on Delivery (COD), eSewa, Khalti, Card payments, and Direct Bank Transfers."
        }
    ]
