from pydantic import BaseModel

class LoginRequest(BaseModel):
    correo: str
    password: str

class RegisterRequest(BaseModel):
    nombre: str
    apellido: str | None = ""
    correo: str
    password: str
    telefono: str | None = ""
    direccion: str | None = ""
    fecha_nacimiento: str | None = ""
    id_tipo_documento: int | None = None

class EmailRequest(BaseModel):
    correo: str

class ResetRequest(BaseModel):
    password: str

class DeleteAccountRequest(BaseModel):
    password: str