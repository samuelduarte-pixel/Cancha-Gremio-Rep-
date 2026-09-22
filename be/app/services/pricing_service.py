# ¿Qué? Resolución dinámica del precio por hora según la franja horaria del día
# ¿Para qué? Aplicar las tarifas valle/pico/sábado/domingo-festivo a cada reserva
# ¿Impacto? Si una franja aplica se cobra su punto medio; si no aplica ninguna, se usa el precio base de la cancha

from datetime import datetime, time
from sqlalchemy.orm import Session
from app.models.pricing_tier import PricingTier
from app.models.field import Field
from app.services.festivos import es_festivo


def _minutes(t: time) -> int:
    return t.hour * 60 + t.minute


def day_type_for(dt: datetime) -> str:
    """Clasifica el momento de la reserva: weekday | saturday | sunday_holiday."""
    if dt.weekday() == 6 or es_festivo(dt.date()):
        return "sunday_holiday"
    if dt.weekday() == 5:
        return "saturday"
    return "weekday"


def resolve_tier(db: Session, dt: datetime) -> PricingTier | None:
    """Devuelve la franja activa que aplica para la fecha/hora indicada, o None."""
    day_type = day_type_for(dt)
    tiers = (
        db.query(PricingTier)
        .filter(PricingTier.day_type == day_type, PricingTier.is_active.is_(True))
        .order_by(PricingTier.id)
        .all()
    )
    mins = dt.hour * 60 + dt.minute
    for tier in tiers:
        start, end = _minutes(tier.start_time), _minutes(tier.end_time)
        if start <= mins <= end:
            return tier
    return None


def get_hour_price(db: Session, field: Field, start_time: datetime) -> tuple[float, PricingTier | None]:
    """Precio por hora efectivo y la franja aplicada (None si se usa el precio base de la cancha)."""
    tier = resolve_tier(db, start_time)
    if tier:
        return tier.price, tier
    return field.price_per_hour, None