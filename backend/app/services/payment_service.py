import razorpay
import hmac
import hashlib
from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime
from app.models.wallet import Payment
from app.models.company import Company
from app.core.config import settings


def get_razorpay_client():
    if (
        not settings.RAZORPAY_KEY_ID
        or not settings.RAZORPAY_KEY_SECRET
        or settings.RAZORPAY_KEY_ID == "your-razorpay-key-id"
        or settings.RAZORPAY_KEY_SECRET == "your-razorpay-key-secret"
    ):
        raise HTTPException(
            status_code=400,
            detail="Razorpay keys are not configured. Update RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.",
        )
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


def create_order(db: Session, company: Company, amount: float) -> dict:
    client = get_razorpay_client()
    amount_paise = int(amount * 100)  # Convert to paise

    try:
        order = client.order.create({
            "amount": amount_paise,
            "currency": "INR",
            "notes": {
                "company_id": str(company.id),
                "company_name": company.company_name,
            }
        })
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Razorpay error: {str(e)}")

    # Save order to DB
    payment = Payment(
        company_id=company.id,
        amount=amount,
        razorpay_order_id=order["id"],
        status="created",
    )
    db.add(payment)
    db.commit()

    return {
        "order_id": order["id"],
        "amount": amount,
        "currency": "INR",
        "key": settings.RAZORPAY_KEY_ID,
    }


def verify_and_credit_payment(
    db: Session,
    company: Company,
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str,
) -> Payment:
    # Verify signature
    expected = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(),
        f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
        hashlib.sha256
    ).hexdigest()

    if expected != razorpay_signature:
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    payment = db.query(Payment).filter(
        Payment.razorpay_order_id == razorpay_order_id,
        Payment.company_id == company.id,
    ).first()

    if not payment:
        raise HTTPException(status_code=404, detail="Payment order not found")
    if payment.status == "paid":
        raise HTTPException(status_code=400, detail="Payment already processed")

    # Update payment
    payment.razorpay_payment_id = razorpay_payment_id
    payment.razorpay_signature = razorpay_signature
    payment.status = "paid"
    payment.verified_at = datetime.utcnow()

    # Credit company wallet
    company.wallet_balance += payment.amount
    company.total_deposited += payment.amount

    db.commit()
    db.refresh(payment)
    return payment
