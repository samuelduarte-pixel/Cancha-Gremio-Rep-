# ¿Qué? Modelo ORM para invalidar tokens JWT al cerrar sesión
# ¿Para qué? Que un token revocado deje de ser válido aunque no haya expirado
# ¿Impacto? Cumple el checklist de seguridad: logout invalida tokens

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from app.database import Base
import datetime

class TokenBlacklist(Base):
    __tablename__ = "token_blacklist"

    id = Column(Integer, primary_key=True, index=True)
    jti = Column(String, unique=True, nullable=False, index=True)  # ID único del JWT
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    expires_at = Column(DateTime, nullable=False)  # Para depurar entradas vencidas
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)