from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

class Order(BaseModel):
    id: str
    productTitle: str
    productImage: str
    buyer: str
    amount: str
    status: str
    date: str
    quantity: int
    shippingAddress: str
    paymentMethod: str
    trackingNumber: Optional[str] = None
    estimatedDelivery: Optional[str] = None
    deliveredDate: Optional[str] = None

    class Config:
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }

class OrdersResponse(BaseModel):
    orders: List[Order]

    class Config:
        json_encoders = {
            ObjectId: str,
            datetime: lambda dt: dt.isoformat()
        }
