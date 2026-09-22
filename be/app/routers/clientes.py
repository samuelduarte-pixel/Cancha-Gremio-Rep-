from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.dependencies import require_admin
from app.models.user import User
from app.models.reservation import Reservation
from app.schemas.clientes import ClienteUpdate
from app.services.audit import write_audit

# Todas las rutas de clientes exigen token de administrador
router = APIRouter(prefix="/api/admin/clientes", tags=["clientes"], dependencies=[Depends(require_admin)])


def _serialize(u, total_reservas):
    return {
        "id_usuario": u.id,
        "nombre": u.name,
        "correo": u.email,
        "telefono": u.phone,
        "estado": "activo" if u.is_active else "inactivo",
        "fecha_registro": u.created_at.strftime("%Y-%m-%d") if u.created_at else "",
        "total_reservas": total_reservas,
        "impuntualidades": u.punctuality_strikes or 0,
        "motivo_bloqueo": u.block_reason,
    }


@router.get("/", summary="Listar clientes",
            description="Lista de clientes con su número de reservas (agregado por subconsulta).")
def get_clients(db: Session = Depends(get_db), _admin: User = Depends(require_admin)):
    users = db.query(User).filter(User.role == "CLIENT").all()

    counts = dict(
        db.query(Reservation.user_id, func.count(Reservation.id))
        .group_by(Reservation.user_id)
        .all()
    )
    return [_serialize(u, counts.get(u.id, 0)) for u in users]


@router.put("/{user_id}/estado", summary="Cambiar estado de un cliente")
def toggle_client_status(user_id: int, payload: dict = Body(...), db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    estado = payload.get("estado")
    if estado == "activo":
        user.is_active = True
        user.block_reason = None
    elif estado == "inactivo":
        user.is_active = False
    else:
        raise HTTPException(status_code=400, detail="Estado inválido: use 'activo' o 'inactivo'")

    db.commit()
    write_audit(db, "users", user_id, "UPDATE", f"Cliente {user.name}: estado -> {estado}", performed_by=admin.email)
    return {"message": "Estado actualizado correctamente", "estado": "activo" if user.is_active else "inactivo"}


@router.put("/{user_id}/impuntualidad", summary="Registrar falta de impuntualidad",
            description="Incrementa el contador de impuntualidades consecutivas del cliente. Al llegar a 3, el usuario queda inhabilitado automáticamente.")
def add_punctuality_strike(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    strikes = (user.punctuality_strikes or 0) + 1
    user.punctuality_strikes = strikes

    blocked = False
    if strikes >= 3:
        user.is_active = False
        user.block_reason = "3 impuntualidades consecutivas"
        blocked = True

    db.commit()
    db.refresh(user)
    write_audit(
        db, "users", user_id, "UPDATE",
        f"Cliente {user.name}: impuntualidad #{strikes}" + (" -> INHABILITADO" if blocked else ""),
        performed_by=admin.email,
    )
    return {
        "message": "Impuntualidad registrada correctamente",
        "impuntualidades": user.punctuality_strikes,
        "bloqueado": blocked,
    }


@router.put("/{user_id}/impuntualidad/reset", summary="Reiniciar contador de impuntualidades",
            description="Devuelve a cero el contador de impuntualidades consecutivas del cliente.")
def reset_punctuality_strikes(user_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    user.punctuality_strikes = 0
    db.commit()
    db.refresh(user)
    write_audit(db, "users", user_id, "UPDATE", f"Cliente {user.name}: contador de impuntualidades reiniciado", performed_by=admin.email)
    return {"message": "Contador de impuntualidades reiniciado", "impuntualidades": 0}


@router.put("/{user_id}", summary="Actualizar datos de un cliente",
            description="Actualiza nombre, correo y/o teléfono, validando que el correo no esté duplicado.")
def update_client(user_id: int, data: ClienteUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    if data.nombre is not None:
        if data.nombre.strip().lower() in ("", "null"):
            raise HTTPException(status_code=400, detail="El nombre no puede estar vacío")
        user.name = data.nombre.strip()

    if data.correo is not None:
        correo = data.correo.strip()
        if "@" not in correo:
            raise HTTPException(status_code=400, detail="Correo electrónico inválido")
        existing = db.query(User).filter(User.email.ilike(correo), User.id != user_id).first()
        if existing:
            raise HTTPException(status_code=400, detail="El correo ya está en uso por otro usuario")
        user.email = correo

    if data.telefono is not None:
        user.phone = data.telefono.strip()

    db.commit()
    db.refresh(user)
    write_audit(db, "users", user_id, "UPDATE", f"Cliente actualizado: {user.name}", performed_by=admin.email)
    return _serialize(user, 0)