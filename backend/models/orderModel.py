from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from bson import ObjectId

# The single Order model. There used to be three near-identical copies of this
# (here, models/listingModel.py, routes/orders.py) that drifted apart on which
# fields were optional.
class Order(BaseModel):
    id: str
    productTitle: str
    productImage: str
    buyer: str
    amount: str
    status: str
    date: str
    quantity: int
    shippingAddress: Optional[str] = None
    paymentMethod: Optional[str] = None
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
