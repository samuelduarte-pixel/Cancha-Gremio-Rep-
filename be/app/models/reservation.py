# ¿Qué? Modelo ORM que representa una reserva en la base de datos
# ¿Para qué? Mapear la tabla "reservations" a un objeto Python
# ¿Impacto? Sin este modelo no se pueden guardar reservas

from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey, CheckConstraint
from app.database import Base
import datetime

class Reservation(Base):
    __tablename__ = "reservations"
    __table_args__ = (
        CheckConstraint("status IN ('pending', 'confirmed', 'cancelled')", name="ck_reservations_status"),
        CheckConstraint("payment_status IN ('pending', 'paid', 'cancelled', 'refunded')", name="ck_reservations_payment_status"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Cliente que reserva
    field_id = Column(Integer, ForeignKey("fields.id"), nullable=False)  # Cancha reservada
    client_name = Column(String, nullable=False)
    client_email = Column(String, nullable=False)
    client_phone = Column(String, nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String, default="pending")  # pending, confirmed, cancelled
    payment_status = Column(String, default="pending")  # pending, paid, cancelled, refunded
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
