from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user, require_admin
from app.schemas.field import FieldCreate, FieldUpdate, FieldResponse
from app.models.field import Field
from app.models.user import User
from app.services.audit import write_audit

router = APIRouter(prefix="/api/v1/fields", tags=["fields"])


@router.get("/", response_model=list[FieldResponse],
            summary="Listar canchas activas")
def get_fields(db: Session = Depends(get_db)):
    fields = db.query(Field).filter(Field.is_active == True).all()
    return fields


@router.get("/all", response_model=list[FieldResponse],
            summary="Listar todas las canchas (incluye inactivas)")
def get_all_fields(db: Session = Depends(get_db)):
    fields = db.query(Field).all()
    return fields


@router.get("/{field_id}", response_model=FieldResponse,
            summary="Obtener una cancha")
def get_field(field_id: int, db: Session = Depends(get_db)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    return field


@router.post("/", response_model=FieldResponse, status_code=201,
             summary="Crear cancha",
             description="Crea una cancha verificando que el nombre no esté duplicado y que el precio/tarifa sean positivos.")
def create_field(field: FieldCreate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    duplicate = db.query(Field).filter(Field.name == field.name).first()
    if duplicate:
        raise HTTPException(status_code=409, detail=f"Ya existe una cancha con el nombre '{field.name}'")

    new_field = Field(**field.model_dump())
    db.add(new_field)
    db.commit()
    db.refresh(new_field)
    write_audit(db, "fields", new_field.id, "CREATE", f"Cancha creada: {new_field.name}", performed_by=admin.email)
    return new_field


@router.put("/{field_id}", response_model=FieldResponse,
            summary="Actualizar cancha")
def update_field(field_id: int, data: FieldUpdate, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")

    if data.name is not None and data.name != field.name:
        duplicate = db.query(Field).filter(Field.name == data.name, Field.id != field_id).first()
        if duplicate:
            raise HTTPException(status_code=409, detail=f"Ya existe una cancha con el nombre '{data.name}'")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if value is None:
            continue
        setattr(field, key, value)

    db.commit()
    db.refresh(field)
    write_audit(db, "fields", field.id, "UPDATE", f"Cancha actualizada: {field.name}", performed_by=admin.email)
    return field


@router.delete("/{field_id}", summary="Desactivar cancha",
               description="Desactiva una cancha de forma lógica (is_active = false). No se elimina físicamente por si tiene reservas.")
def delete_field(field_id: int, db: Session = Depends(get_db), admin: User = Depends(require_admin)):
    field = db.query(Field).filter(Field.id == field_id).first()
    if not field:
        raise HTTPException(status_code=404, detail="Cancha no encontrada")
    field.is_active = False
    db.commit()
    write_audit(db, "fields", field_id, "DELETE", f"Cancha desactivada: {field.name}", performed_by=admin.email)
    return {"message": "Cancha desactivada correctamente"}