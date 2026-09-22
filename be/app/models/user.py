# ¿Qué? Modelo ORM para usuarios del sistema
# ¿Para qué? Almacenar datos de clientes y administradores
# ¿Impacto? Permite autenticación y gestión de permisos

from sqlalchemy import Column, Integer, String, Boolean, DateTime, CheckConstraint
from app.database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('CLIENT', 'ADMIN')", name="ck_users_role"),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    phone = Column(String, nullable=False)
    password = Column(String, nullable=False)  # Hash seguro
    role = Column(String, default="CLIENT")  # CLIENT o ADMIN
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)  # Confirmó el correo de registro
    failed_attempts = Column(Integer, default=0)  # Intentos de login fallidos
    locked_until = Column(DateTime, nullable=True)  # Bloqueo temporal tras intentos fallidos
    session_version = Column(Integer, default=0)  # Al incrementarse invalida todas las sesiones (logout-all)
    punctuality_strikes = Column(Integer, default=0)  # Faltas de impuntualidad consecutivas
    block_reason = Column(String, nullable=True)  # Motivo por el que se inhabilitó (p.ej. impuntualidad)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
