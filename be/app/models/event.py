# ¿Qué? Modelo ORM para eventos y mantenimientos
# ¿Para qué? Bloquear horarios por mantenimiento, eventos especiales, etc.
# ¿Impacto? Evita que se reserven horarios durante mantenimiento

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, CheckConstraint
from app.database import Base
import datetime

class Event(Base):
    __tablename__ = "events"
    __table_args__ = (
        CheckConstraint("event_type IN ('MAINTENANCE', 'TOURNAMENT', 'LEAGUE', 'SPECIAL', 'PRIVATE_EVENT')", name="ck_events_event_type"),
    )

    id = Column(Integer, primary_key=True, index=True)
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)  # Referencia a la cancha
    name = Column(String, nullable=False)  # Ej: "Mantenimiento", "Torneo", "Evento privado"
    description = Column(String, default="")
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    event_type = Column(String, default="MAINTENANCE")  # MAINTENANCE, TOURNAMENT, PRIVATE_EVENT
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
