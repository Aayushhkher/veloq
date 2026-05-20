"""
Seed script — creates admin user + demo data for development.
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.db.database import SessionLocal, init_db
from app.models.user import User, UserRole
from app.models.company import Company
from app.models.survey import Survey, SurveyQuestion, SurveyStatus, QuestionType
from app.core.security import get_password_hash


def seed():
    init_db()
    db = SessionLocal()

    try:
        # ── Admin user ──────────────────────────────────────────────────────────
        admin = db.query(User).filter(User.email == "admin@veloq.com").first()
        if not admin:
            admin = User(
                email="admin@veloq.com",
                full_name="Platform Admin",
                hashed_password=get_password_hash("Admin@12345"),
                role=UserRole.ADMIN,
                is_verified=True,
                is_active=True,
            )
            db.add(admin)
            db.flush()
            print(f"✓ Admin created  — admin@veloq.com / Admin@12345")
        else:
            print("⚠ Admin already exists, skipping")

        # ── Demo company user ───────────────────────────────────────────────────
        company_user = db.query(User).filter(User.email == "company@demo.com").first()
        if not company_user:
            company_user = User(
                email="company@demo.com",
                full_name="Acme Corp",
                hashed_password=get_password_hash("Demo@12345"),
                role=UserRole.COMPANY,
                is_verified=True,
                is_active=True,
            )
            db.add(company_user)
            db.flush()

            company = Company(
                user_id=company_user.id,
                company_name="Acme Corp",
                description="Leading consumer products company",
                industry="Consumer Goods",
                wallet_balance=5000.0,
                total_deposited=5000.0,
                is_verified=True,
            )
            db.add(company)
            db.flush()
            print(f"✓ Company created — company@demo.com / Demo@12345")

            # ── Demo surveys ──────────────────────────────────────────────────────
            surveys_data = [
                {
                    "title": "Customer Satisfaction Survey 2024",
                    "description": "Help us improve our products and services",
                    "category": "Consumer Goods",
                    "reward_per_response": 25.0,
                    "max_responses": 100,
                    "estimated_time_minutes": 5,
                    "status": SurveyStatus.ACTIVE,
                    "questions": [
                        {"text": "How satisfied are you with our products overall?", "type": QuestionType.RATING, "options": None},
                        {"text": "Which product category do you purchase most often?", "type": QuestionType.MCQ, "options": ["Electronics", "Clothing", "Food & Beverages", "Home Goods", "Other"]},
                        {"text": "How did you first hear about us?", "type": QuestionType.MCQ, "options": ["Social Media", "Friend/Family", "Online Ad", "Search Engine", "Physical Store"]},
                        {"text": "What would you improve about our service?", "type": QuestionType.TEXT, "options": None},
                    ]
                },
                {
                    "title": "Product Feedback — New App Launch",
                    "description": "We're launching a new app and want your feedback before we go live",
                    "category": "Technology",
                    "reward_per_response": 40.0,
                    "max_responses": 50,
                    "estimated_time_minutes": 8,
                    "status": SurveyStatus.ACTIVE,
                    "questions": [
                        {"text": "How often do you use mobile apps for shopping?", "type": QuestionType.MCQ, "options": ["Daily", "Few times a week", "Weekly", "Monthly", "Rarely"]},
                        {"text": "Which features are most important to you in a shopping app?", "type": QuestionType.CHECKBOX, "options": ["Easy navigation", "Fast checkout", "Price comparison", "Deals & coupons", "Wishlist", "Reviews"]},
                        {"text": "On a scale of 1-10, how likely are you to try a new shopping app?", "type": QuestionType.SCALE, "options": None},
                        {"text": "What is your biggest frustration with existing shopping apps?", "type": QuestionType.TEXT, "options": None},
                    ]
                },
                {
                    "title": "Health & Wellness Habits Study",
                    "description": "Understanding modern health habits for our wellness product line",
                    "category": "Health",
                    "reward_per_response": 15.0,
                    "max_responses": 200,
                    "estimated_time_minutes": 4,
                    "status": SurveyStatus.ACTIVE,
                    "questions": [
                        {"text": "How many days per week do you exercise?", "type": QuestionType.MCQ, "options": ["0 days", "1-2 days", "3-4 days", "5-6 days", "Every day"]},
                        {"text": "Which wellness activities do you practice?", "type": QuestionType.CHECKBOX, "options": ["Yoga", "Meditation", "Running", "Gym", "Cycling", "Swimming", "None"]},
                        {"text": "Rate your overall health satisfaction (1-5)", "type": QuestionType.RATING, "options": None},
                    ]
                },
            ]

            for s_data in surveys_data:
                budget = s_data["reward_per_response"] * s_data["max_responses"]
                commission = budget * 0.10
                company.wallet_balance -= (budget + commission)
                company.total_spent += (budget + commission)

                survey = Survey(
                    company_id=company.id,
                    title=s_data["title"],
                    description=s_data["description"],
                    category=s_data["category"],
                    reward_per_response=s_data["reward_per_response"],
                    max_responses=s_data["max_responses"],
                    total_budget=budget,
                    estimated_time_minutes=s_data["estimated_time_minutes"],
                    status=s_data["status"],
                    is_active=True,
                )
                db.add(survey)
                db.flush()

                for i, q_data in enumerate(s_data["questions"]):
                    q = SurveyQuestion(
                        survey_id=survey.id,
                        question_text=q_data["text"],
                        question_type=q_data["type"],
                        options=q_data["options"],
                        is_required=True,
                        order=i,
                        min_value=1 if q_data["type"] == QuestionType.SCALE else None,
                        max_value=10 if q_data["type"] == QuestionType.SCALE else None,
                    )
                    db.add(q)

                print(f"  ✓ Survey: {s_data['title']}")

        else:
            print("⚠ Company already exists, skipping")

        # ── Demo regular user ───────────────────────────────────────────────────
        demo_user = db.query(User).filter(User.email == "user@demo.com").first()
        if not demo_user:
            demo_user = User(
                email="user@demo.com",
                full_name="Demo User",
                hashed_password=get_password_hash("Demo@12345"),
                role=UserRole.USER,
                is_verified=True,
                is_active=True,
                wallet_balance=150.0,
                total_earned=150.0,
                surveys_completed=6,
                upi_id="demouser@okicici",
            )
            db.add(demo_user)
            print(f"✓ User created    — user@demo.com / Demo@12345")
        else:
            print("⚠ Demo user already exists, skipping")

        db.commit()
        print("\n✅ Seed complete!")
        print("\nLogin credentials:")
        print("  Admin:   admin@veloq.com / Admin@12345")
        print("  Company: company@demo.com / Demo@12345")
        print("  User:    user@demo.com / Demo@12345")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Seed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
