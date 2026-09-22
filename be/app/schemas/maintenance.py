from pydantic import BaseModel, Field
from typing import Optional

FECHA_RE = r"^\d{4}-\d{2}-\d{2}$"
HORA_RE = r"^\d{2}:\d{2}$"


class MaintenanceCreate(BaseModel):
    cancha: int = Field(gt=0, description="ID de la cancha (field_id)")
    fecha: str = Field(pattern=FECHA_RE, description="Formato YYYY-MM-DD")
    horaInicio: str = Field(pattern=HORA_RE, description="Formato HH:MM")
    horaFin: str = Field(pattern=HORA_RE, description="Formato HH:MM")
    descripcion: str = Field(min_length=3, max_length=300)
    proveedor: Optional[str] = Field(default=None, max_length=100)


class MaintenanceUpdate(BaseModel):
    cancha: int | None = Field(default=None, gt=0)
    fecha: str | None = Field(default=None, pattern=FECHA_RE)
    horaInicio: str | None = Field(default=None, pattern=HORA_RE)
    horaFin: str | None = Field(default=None, pattern=HORA_RE)
    descripcion: str | None = Field(default=None, min_length=3, max_length=300)
    proveedor: Optional[str] = Field(default=None, max_length=100)


class MaintenanceResponse(BaseModel):
    id: int
    cancha: int
    fecha: str
    horaInicio: str
    horaFin: str
    descripcion: str
    proveedor: Optional[str] = None

    class Config:
        from_attributes = True