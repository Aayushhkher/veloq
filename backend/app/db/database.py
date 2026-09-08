from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,
    max_overflow=20
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app.models import user, company, survey, wallet
    Base.metadata.create_all(bind=engine)

    # Auto-migration: check if columns exist and add them if they don't
    from sqlalchemy import inspect, text
    inspector = inspect(engine)
    try:
        columns = [c['name'] for c in inspector.get_columns('survey_responses')]
        with engine.begin() as conn:
            if 'is_flagged' not in columns:
                conn.execute(text("ALTER TABLE survey_responses ADD COLUMN is_flagged BOOLEAN DEFAULT FALSE"))
            if 'flag_reasons' not in columns:
                conn.execute(text("ALTER TABLE survey_responses ADD COLUMN flag_reasons JSON DEFAULT '[]'"))
            if 'quality_score' not in columns:
                conn.execute(text("ALTER TABLE survey_responses ADD COLUMN quality_score FLOAT DEFAULT 1.0"))
            if 'status' not in columns:
                conn.execute(text("ALTER TABLE survey_responses ADD COLUMN status VARCHAR(50) DEFAULT 'approved'"))
    except Exception as e:
        import sys
        print(f"Auto-migration warning: {e}", file=sys.stderr)
