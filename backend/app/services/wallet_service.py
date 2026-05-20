from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.user import User
from app.models.wallet import WalletTransaction, Withdrawal, WithdrawalStatus, TransactionType
from app.core.config import settings
from datetime import datetime


def request_withdrawal(db: Session, user: User, amount: float, upi_id: str) -> Withdrawal:
    if amount < settings.MIN_WITHDRAWAL_AMOUNT:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum withdrawal amount is ₹{settings.MIN_WITHDRAWAL_AMOUNT}"
        )
    if user.wallet_balance < amount:
        raise HTTPException(status_code=400, detail="Insufficient wallet balance")

    # Check for pending withdrawal
    pending = db.query(Withdrawal).filter(
        Withdrawal.user_id == user.id,
        Withdrawal.status == WithdrawalStatus.PENDING
    ).first()
    if pending:
        raise HTTPException(status_code=400, detail="You already have a pending withdrawal request")

    # Deduct from wallet immediately (hold)
    user.wallet_balance -= amount

    withdrawal = Withdrawal(
        user_id=user.id,
        amount=amount,
        upi_id=upi_id,
        status=WithdrawalStatus.PENDING,
    )
    db.add(withdrawal)

    # Record transaction
    txn = WalletTransaction(
        user_id=user.id,
        transaction_type=TransactionType.WITHDRAWAL,
        amount=-amount,
        balance_after=user.wallet_balance,
        description=f"Withdrawal request to UPI: {upi_id}",
        reference_id=None,
        status="pending",
    )
    db.add(txn)

    db.commit()
    db.refresh(withdrawal)
    return withdrawal


def process_withdrawal(db: Session, withdrawal_id: int, action: str, admin_notes: str = None) -> Withdrawal:
    withdrawal = db.query(Withdrawal).filter(Withdrawal.id == withdrawal_id).first()
    if not withdrawal:
        raise HTTPException(status_code=404, detail="Withdrawal not found")
    if withdrawal.status != WithdrawalStatus.PENDING:
        raise HTTPException(status_code=400, detail="Withdrawal is not pending")

    withdrawal.admin_notes = admin_notes
    withdrawal.processed_at = datetime.utcnow()

    if action == "approve":
        withdrawal.status = WithdrawalStatus.APPROVED
        # Update the transaction status
        txn = db.query(WalletTransaction).filter(
            WalletTransaction.user_id == withdrawal.user_id,
            WalletTransaction.transaction_type == TransactionType.WITHDRAWAL,
        ).order_by(WalletTransaction.created_at.desc()).first()
        if txn:
            txn.status = "completed"
    elif action == "reject":
        withdrawal.status = WithdrawalStatus.REJECTED
        # Refund the user
        user = db.query(User).filter(User.id == withdrawal.user_id).first()
        user.wallet_balance += withdrawal.amount

        refund_txn = WalletTransaction(
            user_id=user.id,
            transaction_type=TransactionType.REFUND,
            amount=withdrawal.amount,
            balance_after=user.wallet_balance,
            description=f"Withdrawal rejected - refunded. Reason: {admin_notes or 'Admin rejected'}",
        )
        db.add(refund_txn)
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    db.commit()
    db.refresh(withdrawal)
    return withdrawal


def get_user_transactions(db: Session, user_id: int, skip: int = 0, limit: int = 20):
    return db.query(WalletTransaction).filter(
        WalletTransaction.user_id == user_id
    ).order_by(WalletTransaction.created_at.desc()).offset(skip).limit(limit).all()


def get_user_withdrawals(db: Session, user_id: int, skip: int = 0, limit: int = 20):
    return db.query(Withdrawal).filter(
        Withdrawal.user_id == user_id
    ).order_by(Withdrawal.requested_at.desc()).offset(skip).limit(limit).all()
