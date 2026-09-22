from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_admin
from app.models.event import Event
from app.models.field import Field
from app.models.user import User
from app.schemas.event import EventCreate, EventUpdate
from app.services.audit import write_audit

router = APIRouter(prefix="/eventos", tags=["eventos"])

VALID_EVENT_TYPES = {"MAINTENANCE", "TOURNAMENT", "LEAGUE", "SPECIAL", "PRIVATE_EVENT"}


def _map_tipo(event_type):
    t = "torneo"
    if event_type == "TOURNAMENT":
        t = "torneo"
    elif event_type == "LEAGUE":
        t = "liga"
    elif event_type == "SPECIAL":
        t = "evento_especial"
    elif event_type == "PRIVATE_EVENT":
        t = "evento_especial"
    return t


@router.get("/", summary="Listar eventos",
            description="Lista los eventos (torneos, ligas y especiales) excluyendo mantenimientos, mapeados para el frontend.")
def get_events(db: Session = Depends(get_db)):
    events = db.query(Event).filter(Event.event_type != "MAINTENANCE").all()
    fields = {f.id: f for f in db.query(Field).all()}
    result = []
    for ev in events:
        start_str = ev.start_time.strftime("%H:%M") if ev.start_time else "00:00"
        end_str = ev.end_time.strftime("%H:%M") if ev.end_time else "00:00"
        fecha_str = ev.start_time.strftime("%Y-%m-%d") if ev.start_time else ""
        field = fields.get(ev.field_id)

        result.append({
            "id": str(ev.id),
            "titulo": ev.name,
            "descripcion": ev.description,
            "tipo": _map_tipo(ev.event_type),
            "fecha": fecha_str,
            "horaInicio": start_str,
            "horaFin": end_str,
            "cupos": 10,
            "cuposOcupados": 0,
            "precio": 0,
            "activo": True,
            "cancha_id": ev.field_id,
            "cancha": field.name if field else f"Cancha {ev.field_id}",
            "superficie": field.surface_type if field else "Sintética",
            "capacidad": field.capacity if field else 10,
        })
    return result


@router.post("/", status_code=201, summary="Crear evento",
             description="Crea un evento o bloqueo de horario verificando que la cancha exista, el horario sea válido y no se solape con otro evento/reserva.")
def create_event(data: EventCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    field = db.query(Field).filter(Field.id == data.field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")

    if data.event_type not in VALID_EVENT_TYPES:
        raise HTTPException(status_code=400, detail=f"Tipo de evento inválido: {data.event_type}")

    if data.end_time <= data.start_time:
        raise HTTPException(status_code=400, detail="La fecha de inicio debe ser anterior a la de fin")

    overlap = db.query(Event).filter(
        Event.field_id == data.field_id,
        Event.start_time < data.end_time,
        Event.end_time > data.start_time,
    ).first()
    if overlap:
        raise HTTPException(status_code=409, detail=f"Ya existe un evento/mantenimiento en ese horario ({overlap.name})")

    db_event = Event(
        field_id=data.field_id,
        name=data.name.strip(),
        description=data.description or "",
        start_time=data.start_time,
        end_time=data.end_time,
        event_type=data.event_type
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    write_audit(
        db,
        "events",
        db_event.id,
        "CREATE",
        f"Evento creado: {db_event.name} ({db_event.event_type}) en cancha {db_event.field_id}",
        performed_by=admin.email,
    )
    return db_event


@router.put("/{event_id}", summary="Actualizar evento",
            description="Actualiza uno o varios campos de un evento con validación de tipos y de solapamiento.")
def update_event(event_id: int, data: EventUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    has_time = (data.start_time is not None) or (data.end_time is not None)
    if has_time:
        inicio = data.start_time if data.start_time is not None else event.start_time
        fin = data.end_time if data.end_time is not None else event.end_time
        if fin <= inicio:
            raise HTTPException(status_code=400, detail="La fecha de inicio debe ser anterior a la de fin")

    field_id = data.field_id if data.field_id is not None else event.field_id
    if field_id != event.field_id or has_time:
        field = db.query(Field).filter(Field.id == field_id).first()
        if not field:
            raise HTTPException(status_code=404, detail="Cancha no encontrada")
        oc = db.query(Event).filter(
            Event.field_id == field_id,
            Event.start_time < fin,
            Event.end_time > inicio,
            Event.id != event.id,
        ).first()
        if oc:
            raise HTTPException(status_code=409, detail=f"Ya existe un evento/mantenimiento en ese horario ({oc.name})")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is None:
            continue
        if key == "name":
            event.name = value.strip()
        elif key == "description":
            event.description = value or ""
        else:
            setattr(event, key, value)

    db.commit()
    db.refresh(event)
    write_audit(db, "events", event.id, "UPDATE", f"Evento actualizado: {event.name}", performed_by=admin.email)
    return event


@router.delete("/{event_id}", summary="Eliminar evento",
               description="Elimina un evento de forma permanente.")
def delete_event(event_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")

    db.delete(event)
    db.commit()
    write_audit(db, "events", event_id, "DELETE", f"Evento eliminado: {event.name}", performed_by=admin.email)
    return {"message": "Evento eliminado correctamente"}