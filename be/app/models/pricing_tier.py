# ¿Qué? Modelo ORM para la tabla de tarifas por franja horaria (horario valle/pico/fin de semana)
# ¿Para qué? Guardar el esquema de precios dinámico que se aplica según el día y la hora de cada reserva
# ¿Impacto? El precio de una reserva se calcula con base en la franja vigente; si no hay franja, se usa el precio base de la cancha

from sqlalchemy import Column, Integer, String, Float, Time, Boolean
from app.database import Base

class PricingTier(Base):
    __tablename__ = "pricing_tiers"

    id = Column(Integer, primary_key=True, index=True)
    # Nombre de la franja, ej.: "Valle (Lunes a Viernes)"
    name = Column(String, nullable=False)
    # Tipo de día: weekday | saturday | sunday_holiday
    day_type = Column(String, nullable=False, index=True)
    # Rango horario en que aplica la franja (HH:MM)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    # Rango de la tarifa estimada (por hora) y punto medio que se cobra
    price_min = Column(Float, nullable=False)
    price_max = Column(Float, nullable=False)
    price = Column(Float, nullable=False)  # Punto medio del rango, valor a cobrar por hora
    notes = Column(String, default="")
    is_active = Column(Boolean, default=True)