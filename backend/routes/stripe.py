# from fastapi import APIRouter, Request, HTTPException
# from fastapi.responses import JSONResponse
# import os
# import stripe

# router = APIRouter()

# stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# @router.post("/create-checkout-session")
# async def create_checkout_session(request: Request):
#     data = await request.json()
#     product = data.get("product")
#     if not product:
#         raise HTTPException(status_code=400, detail="Product info required")
#     try:
#         session = stripe.checkout.Session.create(
#             payment_method_types=["card"],
#             line_items=[{
#                 "price_data": {
#                     "currency": "inr",
#                     "product_data": {
#                         "name": product["title"],
#                         "description": product["description"][:100],
#                     },
#                     "unit_amount": int(float(product["price"]) * 100),
#                 },
#                 "quantity": 1,
#             }],
#             mode="payment",
#             success_url="http://localhost:3000/marketplace?success=true",
#             cancel_url="http://localhost:3000/marketplace?canceled=true",
#         )
#         return JSONResponse({"url": session.url})
#     except Exception as e:
#         print("Stripe error:", e)
#         raise HTTPException(status_code=500, detail="Stripe session creation failed")


from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import JSONResponse
import os
import stripe
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

# Set the Stripe secret key from the environment
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter()

@router.post("/create-checkout-session")
async def create_checkout_session(request: Request):
    data = await request.json()
    product = data.get("product")
    
    if not product:
        raise HTTPException(status_code=400, detail="Product info required")
    
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "inr",
                    "product_data": {
                        "name": product["title"],
                        "description": product["description"][:100],
                    },
                    "unit_amount": int(float(product["price"]) * 100),
                },
                "quantity": 1,
            }],
            mode="payment",
            success_url="http://localhost:3000/marketplace?success=true",
            cancel_url="http://localhost:3000/marketplace?canceled=true",
        )
        return JSONResponse({"url": session.url})
    
    except Exception as e:
        print("Stripe error:", e)
        raise HTTPException(status_code=500, detail="Stripe session creation failed")
