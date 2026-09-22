# ¿Qué? Configuración de la conexión a PostgreSQL con SQLAlchemy
# ¿Para qué? Proveer una sesión de base de datos a cada endpoint
# ¿Impacto? Sin esto no se pueden realizar operaciones en la BD

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings

engine = create_engine(
    settings.database_url.replace("postgresql://", "postgresql+psycopg://"),
    pool_pre_ping=True,
    pool_recycle=300
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    # ¿Qué? Generador que provee una sesión de BD por petición
    # ¿Para qué? Garantizar que la sesión se cierra al terminar
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()