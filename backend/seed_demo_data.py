"""
seed_demo_data.py - Populates realistic demo responses, surveys, and transactions.
Run: source venv/bin/activate && python seed_demo_data.py
"""
import sys
import os
import random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, init_db
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.survey import Survey, SurveyQuestion, SurveyResponse, SurveyStatus, QuestionType
from app.models.wallet import WalletTransaction, TransactionType, TransactionStatus, Payment
from app.core.security import get_password_hash


def seed_rich_data():
    init_db()
    db = SessionLocal()

    try:
        # 1. Ensure Company has healthy balance & deposits
        company = db.query(Company).first()
        if company:
            company.wallet_balance = 8500.0
            company.total_deposited = 20000.0
            company.total_spent = 11500.0
            db.commit()
            print(f"✓ Updated Company '{company.company_name}': balance=₹8500, spent=₹11500")

            # Add payment record
            p = db.query(Payment).filter(Payment.company_id == company.id).first()
            if not p:
                payment = Payment(
                    company_id=company.id,
                    razorpay_order_id="order_demo_12345",
                    razorpay_payment_id="pay_demo_67890",
                    amount=20000.0,
                    status="paid",
                    created_at=datetime.utcnow() - timedelta(days=30)
                )
                db.add(payment)
                db.commit()

        # 2. Create pool of respondent users
        demo_respondents = [
            ("Priya Sharma", "priya.s@example.com"),
            ("Rahul Mehta", "rahul.m@example.com"),
            ("Ananya Roy", "ananya.r@example.com"),
            ("Arjun Kapoor", "arjun.k@example.com"),
            ("Sneha Patel", "sneha.p@example.com"),
            ("Vikram Nair", "vikram.n@example.com"),
            ("Kavita Iyer", "kavita.i@example.com"),
            ("Rohan Das", "rohan.d@example.com"),
            ("Pooja Verma", "pooja.v@example.com"),
            ("Aditya Joshi", "aditya.j@example.com"),
        ]

        created_users = []
        # Include primary demo user
        demo_user = db.query(User).filter(User.email == "user@demo.com").first()
        if demo_user:
            demo_user.wallet_balance = 345.0
            demo_user.total_earned = 545.0
            demo_user.surveys_completed = 8
            created_users.append(demo_user)

        for name, email in demo_respondents:
            u = db.query(User).filter(User.email == email).first()
            if not u:
                u = User(
                    email=email,
                    full_name=name,
                    hashed_password=get_password_hash("Demo@12345"),
                    role=UserRole.USER,
                    is_verified=True,
                    is_active=True,
                    wallet_balance=float(random.randint(50, 400)),
                    total_earned=float(random.randint(150, 750)),
                    surveys_completed=random.randint(3, 12),
                    upi_id=f"{email.split('@')[0]}@okhdfc"
                )
                db.add(u)
                db.flush()
            created_users.append(u)
        db.commit()
        print(f"✓ Total {len(created_users)} respondent users active")

        # 3. Populate Responses for each survey
        surveys = db.query(Survey).all()
        for survey in surveys:
            questions = db.query(SurveyQuestion).filter(SurveyQuestion.survey_id == survey.id).order_by(SurveyQuestion.order).all()
            if not questions:
                continue

            # Clear existing responses to ensure fresh clean dataset
            db.query(SurveyResponse).filter(SurveyResponse.survey_id == survey.id).delete()
            db.commit()

            # Determine response target
            target_count = 28 if "Customer" in survey.title else (18 if "Product" in survey.title else 35)

            now = datetime.utcnow()
            for i in range(target_count):
                resp_user = created_users[i % len(created_users)]
                submitted_at = now - timedelta(days=random.randint(0, 18), hours=random.randint(1, 23), minutes=random.randint(5, 50))
                time_taken = random.randint(120, 480)

                # Generate realistic answers based on question types
                answers = {}
                for q in questions:
                    q_id = str(q.id)
                    if q.question_type == QuestionType.RATING:
                        answers[q_id] = random.choice([4, 5, 5, 4, 3, 5, 4])
                    elif q.question_type == QuestionType.MCQ:
                        if q.options:
                            answers[q_id] = random.choice(q.options)
                        else:
                            answers[q_id] = "Option A"
                    elif q.question_type == QuestionType.CHECKBOX:
                        if q.options:
                            k = min(len(q.options), random.randint(1, 3))
                            answers[q_id] = random.sample(q.options, k)
                        else:
                            answers[q_id] = ["Feature 1"]
                    elif q.question_type == QuestionType.SCALE:
                        answers[q_id] = random.choice([7, 8, 9, 8, 10, 9, 8])
                    elif q.question_type == QuestionType.TEXT:
                        sample_texts = [
                            "Overall great service! The delivery was extremely fast and the app was intuitive.",
                            "I really appreciate the quick response times. Maybe offer more loyalty reward options.",
                            "The checkout process could be smoother on mobile, but products are top-notch.",
                            "Loved the recent updates! Everything feels faster and the UI looks very modern.",
                            "Clean design and easy to navigate. Highly recommended to friends.",
                            "More filtering options by price range would be super helpful.",
                            "Pricing is very competitive and quality exceeded my expectations."
                        ]
                        answers[q_id] = random.choice(sample_texts)

                is_flagged = (i == 3)  # Make 1 response flagged for demonstration
                quality_score = 0.45 if is_flagged else round(random.uniform(0.85, 0.98), 2)
                flag_reasons = ["Rapid submission detected (under 45s)", "Repetitive pattern"] if is_flagged else []
                status = "flagged" if is_flagged else "approved"

                response = SurveyResponse(
                    survey_id=survey.id,
                    user_id=resp_user.id,
                    answers=answers,
                    reward_earned=survey.reward_per_response,
                    completed_at=submitted_at,
                    time_taken_seconds=time_taken,
                    ip_address=f"192.168.1.{random.randint(10, 250)}",
                    is_flagged=is_flagged,
                    flag_reasons=flag_reasons,
                    quality_score=quality_score,
                    status=status
                )
                db.add(response)

            survey.current_responses = target_count
            db.commit()
            print(f"✓ Survey '{survey.title}': {target_count} responses seeded")

        # 4. Populate Wallet Transactions for user@demo.com
        if demo_user:
            db.query(WalletTransaction).filter(WalletTransaction.user_id == demo_user.id).delete()
            db.commit()

            txn_dates = [
                now - timedelta(days=18),
                now - timedelta(days=14),
                now - timedelta(days=11),
                now - timedelta(days=8),
                now - timedelta(days=5),
                now - timedelta(days=3),
                now - timedelta(days=1),
            ]
            rewards = [25.0, 40.0, 15.0, 25.0, 40.0, 50.0, 40.0]
            descriptions = [
                "Reward for Customer Satisfaction Survey 2024",
                "Reward for Product Feedback — New App Launch",
                "Reward for Health & Wellness Habits Study",
                "Reward for Customer Satisfaction Survey 2024",
                "Reward for Product Feedback — New App Launch",
                "Reward for Mobile UX Usability Study",
                "Reward for Consumer Brand Preference Survey"
            ]

            bal = 100.0
            for dt, r_amt, desc in zip(txn_dates, rewards, descriptions):
                bal += r_amt
                txn = WalletTransaction(
                    user_id=demo_user.id,
                    amount=r_amt,
                    transaction_type=TransactionType.SURVEY_REWARD,
                    description=desc,
                    balance_after=bal,
                    status=TransactionStatus.COMPLETED,
                    created_at=dt
                )
                db.add(txn)

            # Add one withdrawal
            bal -= 150.0
            wd_txn = WalletTransaction(
                user_id=demo_user.id,
                amount=-150.0,
                transaction_type=TransactionType.WITHDRAWAL,
                description="Withdrawal to UPI demouser@okicici",
                balance_after=bal,
                status=TransactionStatus.COMPLETED,
                created_at=now - timedelta(days=2)
            )
            db.add(wd_txn)
            demo_user.wallet_balance = bal
            demo_user.total_earned = sum(rewards)
            demo_user.surveys_completed = len(rewards)
            db.commit()
            print(f"✓ Seeded {len(rewards) + 1} wallet transactions for user@demo.com (total_earned=₹{demo_user.total_earned})")

        print("\n🎉 Demo data seeding successfully finished!")

    except Exception as e:
        db.rollback()
        print(f"❌ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_rich_data()
