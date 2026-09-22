# ¿Qué? Schemas Pydantic para validar datos de usuarios
# ¿Para qué? Garantizar que los datos de usuarios tienen el formato correcto
# ¿Impacto? Sin validación, datos incorrectos podrían dañar la BD

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    phone: str
    password: str
    role: str = "CLIENT"

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
