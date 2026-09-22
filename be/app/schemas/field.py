# ¿Qué? Schemas Pydantic para validar datos de campos/canchas
# ¿Para qué? Garantizar que los datos de canchas tienen el formato correcto
# ¿Impacto? Sin validación, datos incorrectos podrían dañar la BD

from pydantic import BaseModel, Field
from datetime import datetime

HOUR_RE = r"^\d{2}:\d{2}$"


class FieldBase(BaseModel):
    name: str = Field(min_length=2, max_length=100, examples=["Cancha 1"])
    description: str = Field(default="", max_length=500)
    price_per_hour: float = Field(gt=0, examples=[50000])
    surface_type: str = Field(default="SYNTHETIC", max_length=30)
    capacity: int = Field(default=10, ge=1, le=100)
    length_meters: float = Field(default=40, gt=0)
    width_meters: float = Field(default=20, gt=0)
    available_hour_start: str = Field(default="06:00", pattern=HOUR_RE)
    available_hour_end: str = Field(default="22:00", pattern=HOUR_RE)


class FieldCreate(FieldBase):
    pass


class FieldUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    description: str | None = Field(default=None, max_length=500)
    price_per_hour: float | None = Field(default=None, gt=0)
    surface_type: str | None = Field(default=None, max_length=30)
    capacity: int | None = Field(default=None, ge=1, le=100)
    length_meters: float | None = Field(default=None, gt=0)
    width_meters: float | None = Field(default=None, gt=0)
    available_hour_start: str | None = Field(default=None, pattern=HOUR_RE)
    available_hour_end: str | None = Field(default=None, pattern=HOUR_RE)
    is_active: bool | None = None


class FieldResponse(BaseModel):
    id: int
    name: str
    description: str | None = ""
    price_per_hour: float
    surface_type: str
    capacity: int
    length_meters: float | None = 40.0
    width_meters: float | None = 20.0
    available_hour_start: str | None = "06:00"
    available_hour_end: str | None = "22:00"
    is_active: bool
    created_at: datetime | None = None

    class Config:
        from_attributes = True