from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import require_admin
from app.models.event import Event
from app.models.field import Field
from app.models.user import User
from app.schemas.maintenance import MaintenanceCreate, MaintenanceUpdate
from app.services.audit import write_audit
from datetime import datetime

router = APIRouter(prefix="/mantenimiento", tags=["mantenimiento"])

FECHA_HORA = "%Y-%m-%d %H:%M"


def _parse_fecha_hora(fecha: str, hora: str) -> datetime:
    try:
        return datetime.strptime(f"{fecha} {hora}", FECHA_HORA)
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha u hora inválido (use YYYY-MM-DD y HH:MM)")


def _check_solape(db: Session, cancha: int, start_dt: datetime, end_dt: datetime, exclude_id: int = None):
    query = db.query(Event).filter(
        Event.field_id == cancha,
        Event.start_time < end_dt,
        Event.end_time > start_dt,
    )
    if exclude_id:
        query = query.filter(Event.id != exclude_id)
    oc = query.first()
    if oc:
        raise HTTPException(status_code=409, detail=f"Ya existe una reserva/evento en ese horario ({oc.name})")


def _serialize(m):
    return {
        "id": str(m.id),
        "cancha": m.field_id,
        "fecha": m.start_time.strftime("%Y-%m-%d") if m.start_time else "",
        "horaInicio": m.start_time.strftime("%H:%M") if m.start_time else "",
        "horaFin": m.end_time.strftime("%H:%M") if m.end_time else "",
        "descripcion": m.name + (" - " + m.description if m.description else ""),
        "proveedor": "Externo",
    }


@router.get("/", summary="Listar mantenimientos",
            description="Lista los mantenimientos programados (eventos de tipo MAINTENANCE).")
def get_maintenances(db: Session = Depends(get_db)):
    maintenances = db.query(Event).filter(Event.event_type == "MAINTENANCE").all()
    return [_serialize(m) for m in maintenances]


@router.post("/", status_code=201, summary="Crear mantenimiento",
             description="Programa un mantenimiento en una cancha validando que exista y que el horario no se solape.")
def create_maintenance(data: MaintenanceCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    field = db.query(Field).filter(Field.id == data.cancha).first()
    if not field:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")

    start_dt = _parse_fecha_hora(data.fecha, data.horaInicio)
    end_dt = _parse_fecha_hora(data.fecha, data.horaFin)
    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="La hora de fin debe ser posterior a la de inicio")

    _check_solape(db, data.cancha, start_dt, end_dt)

    db_maint = Event(
        field_id=data.cancha,
        name="Mantenimiento",
        description=data.descripcion.strip() + (f" (Proveedor: {data.proveedor})" if data.proveedor else ""),
        start_time=start_dt,
        end_time=end_dt,
        event_type="MAINTENANCE"
    )
    db.add(db_maint)
    db.commit()
    db.refresh(db_maint)
    write_audit(
        db,
        "events",
        db_maint.id,
        "CREATE",
        f"Mantenimiento creado en cancha {data.cancha}: {start_dt} - {end_dt} ({data.proveedor or 'Externo'})",
        performed_by=admin.email,
    )
    return _serialize(db_maint)


@router.put("/{maintenance_id}", summary="Actualizar mantenimiento",
            description="Actualiza el horario o descripción de un mantenimiento, revalidando solapamiento.")
def update_maintenance(maintenance_id: int, data: MaintenanceUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    maint = db.query(Event).filter(Event.id == maintenance_id, Event.event_type == "MAINTENANCE").first()
    if not maint:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")

    cancha = data.cancha if data.cancha is not None else maint.field_id
    field = db.query(Field).filter(Field.id == cancha).first()
    if not field:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")

    fecha = data.fecha if data.fecha is not None else maint.start_time.strftime("%Y-%m-%d")
    h_inicio = data.horaInicio if data.horaInicio is not None else maint.start_time.strftime("%H:%M")
    h_fin = data.horaFin if data.horaFin is not None else maint.end_time.strftime("%H:%M")

    start_dt = _parse_fecha_hora(fecha, h_inicio)
    end_dt = _parse_fecha_hora(fecha, h_fin)
    if end_dt <= start_dt:
        raise HTTPException(status_code=400, detail="La hora de fin debe ser posterior a la de inicio")

    _check_solape(db, cancha, start_dt, end_dt, exclude_id=maintenance_id)

    maint.field_id = cancha
    maint.start_time = start_dt
    maint.end_time = end_dt
    if data.descripcion is not None or data.proveedor is not None:
        if data.descripcion is not None:
            base_desc = data.descripcion.strip()
        else:
            base_desc = maint.description.rsplit(" (Proveedor:", 1)[0].strip()
        if data.proveedor is not None:
            base_desc = f"{base_desc} (Proveedor: {data.proveedor})"
        maint.description = base_desc

    db.commit()
    db.refresh(maint)
    write_audit(db, "events", maintenance_id, "UPDATE", f"Mantenimiento actualizado en cancha {cancha}", performed_by=admin.email)
    return _serialize(maint)


@router.delete("/{maintenance_id}", status_code=204, summary="Eliminar mantenimiento")
def delete_maintenance(maintenance_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    maint = db.query(Event).filter(Event.id == maintenance_id, Event.event_type == "MAINTENANCE").first()
    if not maint:
        raise HTTPException(status_code=404, detail="Mantenimiento no encontrado")
    db.delete(maint)
    db.commit()
    write_audit(db, "events", maintenance_id, "DELETE", f"Mantenimiento eliminado en cancha {maint.field_id}", performed_by=admin.email)
    return None