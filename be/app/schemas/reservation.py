# ¿Qué? Schemas Pydantic para validar datos de reservas
# ¿Para qué? Garantizar que los datos recibidos tienen el formato correcto
# ¿Impacto? Sin validación, datos incorrectos podrían dañar la BD

from pydantic import BaseModel, Field, EmailStr
from datetime import datetime

VALID_STATUSES = {"pending", "confirmed", "cancelled"}
VALID_PAYMENT_STATUSES = {"pending", "paid", "cancelled", "refunded"}


class ReservationCreate(BaseModel):
    field_id: int = Field(gt=0)
    client_name: str = Field(min_length=3, max_length=120)
    client_email: EmailStr
    client_phone: str = Field(min_length=7, max_length=20)
    start_time: datetime
    end_time: datetime


class ReservationBulkCreate(BaseModel):
    items: list[ReservationCreate]


class ReservationUpdate(BaseModel):
    field_id: int | None = Field(default=None, gt=0)
    client_name: str | None = Field(default=None, min_length=3, max_length=120)
    client_email: EmailStr | None = None
    client_phone: str | None = Field(default=None, min_length=7, max_length=20)
    start_time: datetime | None = None
    end_time: datetime | None = None
    status: str | None = Field(default=None, pattern="^(pending|confirmed|cancelled)$")
    payment_status: str | None = Field(
        default=None, pattern="^(pending|paid|cancelled|refunded)$"
    )


class ReservationResponse(BaseModel):
    id: int
    field_id: int
    client_name: str
    client_email: str
    client_phone: str
    start_time: datetime
    end_time: datetime
    total_price: float
    status: str
    payment_status: str

    class Config:
        from_attributes = True