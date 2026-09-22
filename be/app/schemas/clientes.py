from pydantic import BaseModel, Field

class ClienteUpdate(BaseModel):
    nombre: str | None = Field(default=None, max_length=120)
    correo: str | None = Field(default=None, max_length=120)
    telefono: str | None = Field(default=None, max_length=20)