# ¿Qué? Router público de tarifas por franja horaria
# ¿Para qué? Mostrar la tabla de tarifas y calcular el precio de una reserva según día/hora
# ¿Impacto? Sin autenticación: tanto la landing como el formulario de reservas lo consumen

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models.pricing_tier import PricingTier
from app.models.field import Field
from app.schemas.pricing import TarifaResponse, TarifaCalculada
from app.services.pricing_service import resolve_tier, get_hour_price

router = APIRouter(prefix="/api/v1/tarifas", tags=["tarifas"])


@router.get("", response_model=list[TarifaResponse],
            summary="Listar tarifas",
            description="Devuelve las franjas de precios vigentes por día y horario. Endpoint público.")
def get_tarifas(db: Session = Depends(get_db)):
    return (
        db.query(PricingTier)
        .filter(PricingTier.is_active.is_(True))
        .order_by(PricingTier.id)
        .all()
    )


@router.get("/calcular", response_model=TarifaCalculada,
            summary="Calcular precio de una reserva",
            description="Calcula el precio por hora y total aplicando la franja vigente para la fecha/hora indicadas. "
                        "Si ninguna franja aplica, usa el precio base de la cancha.")
def calcular_tarifa(
    start: datetime = Query(..., description="Inicio de la reserva (ISO 8601)"),
    end: datetime | None = Query(default=None, description="Fin de la reserva (opcional)"),
    field_id: int | None = Query(default=None, description="Cancha para usar el precio base como respaldo"),
    db: Session = Depends(get_db),
):
    field = db.query(Field).filter(Field.id == field_id).first() if field_id else None

    if field:
        price_per_hour, tier = get_hour_price(db, field, start)
    else:
        tier = resolve_tier(db, start)
        if not tier:
            raise HTTPException(status_code=404, detail="No hay tarifa vigente para ese horario")
        price_per_hour = tier.price

    hours = 1
    if end and end > start:
        hours = round(max((end - start).total_seconds() / 3600, 1), 2)

    return TarifaCalculada(
        tier=TarifaResponse.model_validate(tier) if tier else None,
        tier_name=tier.name if tier else None,
        price_per_hour=price_per_hour,
        hours=hours,
        total_price=round(price_per_hour * hours, 2),
    )