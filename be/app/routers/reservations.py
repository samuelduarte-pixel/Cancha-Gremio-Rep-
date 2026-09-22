from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.schemas.reservation import (
    ReservationCreate,
    ReservationBulkCreate,
    ReservationUpdate,
    ReservationResponse,
)
from app.models.reservation import Reservation
from app.models.field import Field
from app.models.event import Event
from app.models.user import User
from app.services.audit import write_audit
from app.services.pricing_service import get_hour_price

router = APIRouter(prefix="/api/v1/reservations", tags=["reservations"])


def _to_minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)


def check_conflicts(db: Session, field_id: int, start_time, end_time, exclude_id: int = None):
    # Control de duplicidad: impedir reservar la misma cancha en horarios solapados
    query = db.query(Reservation).filter(
        Reservation.field_id == field_id,
        Reservation.status.in_(["pending", "confirmed"]),
        Reservation.start_time < end_time,
        Reservation.end_time > start_time,
    )
    if exclude_id:
        query = query.filter(Reservation.id != exclude_id)
    overlap = query.first()
    if overlap:
        raise HTTPException(
            status_code=409,
            detail=f"La cancha ya está reservada en ese horario (reserva #{overlap.id})",
        )

    # Horario bloqueado por mantenimiento/evento
    blocked = db.query(Event).filter(
        Event.field_id == field_id,
        Event.start_time < end_time,
        Event.end_time > start_time,
    ).first()
    if blocked:
        raise HTTPException(status_code=409, detail=f"Horario bloqueado por: {blocked.name}")


def _check_field_availability(db: Session, field_id: int) -> Field:
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    return field


def _validate_window(field: Field, start_time: datetime, end_time: datetime):
    if end_time <= start_time:
        raise HTTPException(status_code=400, detail="La fecha de inicio debe ser anterior a la de fin")
    # Regla de negocio: la reserva debe caer dentro del horario operativo de la cancha
    try:
        a = _to_minutes(field.available_hour_start)
        b = _to_minutes(field.available_hour_end)
    except (ValueError, AttributeError):
        return
    h_inicio = start_time.hour * 60 + start_time.minute
    h_fin = end_time.hour * 60 + end_time.minute
    # soporta horario que cruza la medianoche (p.ej. 18:00 - 02:00)
    if a >= b:
        dentro = (h_inicio >= a or h_inicio <= b) and (h_fin <= b or h_fin >= a)
    else:
        dentro = h_inicio >= a and h_fin <= b
    if not dentro:
        raise HTTPException(
            status_code=400,
            detail=f"La reserva debe estar dentro del horario operativo de la cancha "
            f"({field.available_hour_start} - {field.available_hour_end})",
        )


def _build_reservation(db: Session, item: ReservationCreate):
    field = _check_field_availability(db, item.field_id)
    _validate_window(field, item.start_time, item.end_time)
    check_conflicts(db, item.field_id, item.start_time, item.end_time)

    hours = max((item.end_time - item.start_time).total_seconds() / 3600, 1)
    price_per_hour, _tier = get_hour_price(db, field, item.start_time)
    return Reservation(
        field_id=item.field_id,
        client_name=item.client_name.strip(),
        client_email=item.client_email.strip(),
        client_phone=item.client_phone.strip(),
        start_time=item.start_time,
        end_time=item.end_time,
        total_price=round(price_per_hour * hours, 2),
        status="confirmed",
        payment_status="pending",
    )


@router.get("", response_model=list[ReservationResponse],
            summary="Listar reservas",
            description="Lista de reservas con filtros opcionales: estado, cancha, rango de fechas y búsqueda por cliente.")
def get_reservations(
    estado: str | None = Query(default=None, description="Filtrar por estado: pending, confirmed, cancelled"),
    cancha: int | None = Query(default=None, description="Filtrar por ID de cancha"),
    desde: datetime | None = Query(default=None, description="Solo reservas que inician desde esta fecha/hora"),
    hasta: datetime | None = Query(default=None, description="Solo reservas que inician hasta esta fecha/hora"),
    q: str | None = Query(default=None, description="Búsqueda por nombre, email o teléfono del cliente"),
    db: Session = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    query = db.query(Reservation)

    if estado:
        if estado not in {"pending", "confirmed", "cancelled"}:
            raise HTTPException(status_code=400, detail=f"Estado inválido: {estado}")
        query = query.filter(Reservation.status == estado)
    if cancha:
        query = query.filter(Reservation.field_id == cancha)
    if desde:
        query = query.filter(Reservation.start_time >= desde)
    if hasta:
        query = query.filter(Reservation.start_time <= hasta)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter(
            Reservation.client_name.ilike(like)
            | Reservation.client_email.ilike(like)
            | Reservation.client_phone.ilike(like)
        )

    query = query.order_by(Reservation.start_time.desc())
    return query.all()


@router.post("/bulk", response_model=dict,
             summary="Carga masiva de reservas",
             description="Crea varias reservas de una sola vez. Si alguna no cumple las reglas de negocio, no se crea ninguna y se reporta el error con el índice.")
def bulk_create_reservations(payload: ReservationBulkCreate, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    items = payload.items
    if not items:
        raise HTTPException(status_code=400, detail="La lista de reservas está vacía")
    if len(items) > 500:
        raise HTTPException(status_code=400, detail="Máximo 500 reservas por carga")

    created = []
    for i, item in enumerate(items, start=1):
        try:
            new_reservation = _build_reservation(db, item)
            db.add(new_reservation)
            db.flush()
        except HTTPException as exc:
            db.rollback()
            raise HTTPException(
                status_code=exc.status_code,
                detail=f"Error en la reserva #{i}: {exc.detail}",
            ) from exc
        created.append(new_reservation)

    db.commit()
    for r in created:
        db.refresh(r)
    write_audit(db, "reservations", None, "BULK_CREATE", f"Se crearon {len(created)} reservas masivamente", performed_by=_user.email)
    return {
        "creadas": len(created),
        "reservas": [ReservationResponse.model_validate(r) for r in created],
    }


@router.get("/{reservation_id}", response_model=ReservationResponse,
            summary="Obtener una reserva")
def get_reservation(reservation_id: int, db: Session = Depends(get_db), _user: User = Depends(get_current_user)):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")
    return reservation


@router.post("", response_model=ReservationResponse, status_code=201,
             summary="Crear reserva",
             description="Crea una reserva verificando que la cancha exista, el horario sea válido y que no se solape con otras reservas o eventos.")
def create_reservation(reservation: ReservationCreate, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    new_reservation = _build_reservation(db, reservation)
    db.add(new_reservation)
    db.commit()
    db.refresh(new_reservation)
    write_audit(
        db,
        "reservations",
        new_reservation.id,
        "CREATE",
        f"Reserva #{new_reservation.id} creada para cancha {new_reservation.field_id}: {new_reservation.start_time} - {new_reservation.end_time}",
        performed_by=user.email,
    )
    return new_reservation


@router.put("/{reservation_id}", response_model=ReservationResponse,
            summary="Actualizar reserva",
            description="Actualiza datos completos (cliente, cancha, horario), estado o estado de pago de una reserva. Si cambian cancha/horario, se revalida disponibilidad y se recalcula el precio.")
def update_reservation(reservation_id: int, data: ReservationUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    changes = []

    new_field_id = data.field_id if data.field_id is not None else reservation.field_id
    new_start = data.start_time if data.start_time is not None else reservation.start_time
    new_end = data.end_time if data.end_time is not None else reservation.end_time

    if (data.field_id is not None and data.field_id != reservation.field_id) or \
       (data.start_time is not None and data.start_time != reservation.start_time) or \
       (data.end_time is not None and data.end_time != reservation.end_time):
        field = _check_field_availability(db, new_field_id)
        _validate_window(field, new_start, new_end)
        check_conflicts(db, new_field_id, new_start, new_end, exclude_id=reservation.id)
        hours = max((new_end - new_start).total_seconds() / 3600, 1)
        price_per_hour, _tier = get_hour_price(db, field, new_start)
        new_price = round(price_per_hour * hours, 2)
        if new_price != reservation.total_price:
            changes.append(f"total_price: {reservation.total_price} -> {new_price}")
            reservation.total_price = new_price
        reservation.field_id = new_field_id
        reservation.start_time = new_start
        reservation.end_time = new_end

    if data.client_name is not None:
        if data.client_name.strip() != reservation.client_name:
            changes.append(f"client_name: {reservation.client_name} -> {data.client_name.strip()}")
        reservation.client_name = data.client_name.strip()
    if data.client_email is not None:
        if data.client_email.strip() != reservation.client_email:
            changes.append(f"client_email: {reservation.client_email} -> {data.client_email.strip()}")
        reservation.client_email = data.client_email.strip()
    if data.client_phone is not None:
        if data.client_phone.strip() != reservation.client_phone:
            changes.append(f"client_phone: {reservation.client_phone} -> {data.client_phone.strip()}")
        reservation.client_phone = data.client_phone.strip()

    if data.status is not None:
        if data.status not in {"pending", "confirmed", "cancelled"}:
            raise HTTPException(status_code=400, detail=f"Estado inválido: {data.status}")
        if data.status != reservation.status:
            changes.append(f"status: {reservation.status} -> {data.status}")
        reservation.status = data.status

    if data.payment_status is not None:
        if data.payment_status not in {"pending", "paid", "cancelled", "refunded"}:
            raise HTTPException(status_code=400, detail=f"Estado de pago inválido: {data.payment_status}")
        if data.payment_status != reservation.payment_status:
            changes.append(f"payment_status: {reservation.payment_status} -> {data.payment_status}")
        reservation.payment_status = data.payment_status

    db.commit()
    db.refresh(reservation)
    if changes:
        write_audit(db, "reservations", reservation.id, "UPDATE", "; ".join(changes), performed_by=admin.email)
    return reservation


@router.delete("/{reservation_id}",
               summary="Cancelar/eliminar reserva",
               description="Cancela una reserva (borrado lógico: pasa a estado 'cancelled').")
def delete_reservation(reservation_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    reservation = db.query(Reservation).filter(Reservation.id == reservation_id).first()
    if not reservation:
        raise HTTPException(status_code=404, detail="Reserva no encontrada")

    reservation.status = "cancelled"
    db.commit()
    db.refresh(reservation)
    write_audit(db, "reservations", reservation_id, "DELETE", f"Reserva #{reservation_id} cancelada", performed_by=admin.email)
    return {"message": "Reserva cancelada correctamente"}