# ¿Qué? Modelo ORM para las canchas/campos disponibles
# ¿Para qué? Guardar información de cada cancha sintética
# ¿Impacto? Permite gestionar múltiples canchas y sus características

from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, UniqueConstraint
from app.database import Base
import datetime

class Field(Base):
    __tablename__ = "fields"
    __table_args__ = (UniqueConstraint("name", name="uq_fields_name"),)

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # Ej: "Cancha 1", "Cancha Premium"
    description = Column(String, default="")
    price_per_hour = Column(Float, nullable=False)  # Precio por hora
    surface_type = Column(String, default="SYNTHETIC")  # SYNTHETIC, NATURAL, CEMENT
    capacity = Column(Integer, default=10)  # Capacidad de jugadores
    length_meters = Column(Float, default=40)  # Largo en metros
    width_meters = Column(Float, default=20)  # Ancho en metros
    available_hour_start = Column(String, default="06:00")  # Hora apertura HH:mm
    available_hour_end = Column(String, default="22:00")  # Hora cierre HH:mm
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
