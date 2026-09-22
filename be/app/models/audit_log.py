# ¿Qué? Modelo ORM para auditoría de acciones críticas
# ¿Para qué? Registrar quién, cuándo y qué cambió en el sistema
# ¿Impacto? Garantiza trazabilidad y cumplimiento del checklist de auditoría

from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base
import datetime

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    table_name = Column(String, nullable=False)  # Tabla afectada (users, reservations, ...)
    record_id = Column(Integer, nullable=True)   # Registro afectado
    action = Column(String, nullable=False)      # CREATE, UPDATE, DELETE
    details = Column(Text, default="")           # Descripción del cambio
    performed_by = Column(String, nullable=True) # Email/usuario que ejecutó la acción
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)