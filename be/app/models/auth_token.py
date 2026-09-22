# ¿Qué? Modelo ORM para tokens de verificación (registro y recuperación de contraseña)
# ¿Para qué? Guardar tokens únicos con expiración y uso único
# ¿Impacto? Garantiza que los enlaces de correo expiran y no pueden reutilizarse

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base
import datetime

class AuthToken(Base):
    __tablename__ = "auth_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    token = Column(String, unique=True, nullable=False)  # SHA-256 del token plano
    token_type = Column(String, nullable=False)  # REGISTER | RESET_PASSWORD
    expires_at = Column(DateTime, nullable=False)
    used_at = Column(DateTime, nullable=True)  # Marca de uso único
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)