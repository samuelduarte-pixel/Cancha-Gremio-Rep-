from typing import Literal

from fastapi import APIRouter, Body, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.auth import LoginRequest, EmailRequest, ResetRequest, RegisterRequest, DeleteAccountRequest
from app.dependencies import get_current_user
from app.models.user import User
from app.services.auth_service import (
    login_user, register_user, confirm_email, get_profile,
    forgot_password, reset_password, refresh_access, logout_user,
    logout_all_devices, request_account_deletion, confirm_account_deletion,
)

router = APIRouter()


@router.post("/login", summary="Iniciar sesión",
             description="Autentica con correo y contraseña. Devuelve access y refresh token. La cuenta se bloquea tras varios intentos fallidos.")
def login(data: LoginRequest):
    return login_user(data)


@router.post("/registro", summary="Registrar usuario",
             description="Crea una cuenta de cliente y envía un enlace de confirmación único con expiración. Sin SMTP (modo dev) se devuelve confirmation_url para probar.")
def register(data: RegisterRequest):
    return register_user(data)


@router.get("/confirmar/{token}", summary="Confirmar correo del registro",
            description="Marca el correo como verificado si el enlace es válido, no expiró y no fue usado.")
def confirmar(token: str):
    return confirm_email(token)


@router.get("/perfil", summary="Obtener perfil del usuario autenticado")
def perfil(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    return get_profile(token)


@router.post("/forgot-password", summary="Solicitar recuperación de contraseña",
             description="Envía (o devuelve en dev) un enlace temporal de un solo uso para restablecer la contraseña. No revela si el correo existe.")
def forgot(data: EmailRequest):
    return forgot_password(data)


@router.post("/reset-password/{token}", summary="Restablecer contraseña con el enlace temporal")
def reset(token: str, data: ResetRequest):
    return reset_password(token, data)


@router.post("/refresh", summary="Renovar tokens expirados",
             description="Recibe el refresh token y emite un par nuevo (access + refresh). Refresca sesiones largas.")
def refresh(refresh_token: str = Body(..., embed=True)):
    return refresh_access(refresh_token)


@router.post("/logout", summary="Cerrar sesión",
             description="Revoca el access token y, opcionalmente, el refresh token para que dejen de ser válidos.")
def logout(
    authorization: str = Header(...),
    refresh_token: str | None = Header(default=None),
):
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    return logout_user(token, refresh_token)


@router.post("/logout-all", summary="Cerrar sesión en todos los dispositivos",
             description="Incrementa la versión de sesión del usuario: todos los tokens emitidos anteriormente (access y refresh) dejan de ser válidos en cualquier dispositivo.")
def logout_all(authorization: str = Header(...)):
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    mensaje = logout_all_devices(token)
    return {"mensaje": mensaje}


@router.post("/eliminar-cuenta", summary="Solicitar eliminación de la cuenta",
             description="Valida la contraseña y envía un enlace de confirmación por correo (modo dev lo devuelve). La cuenta solo se elimina al confirmarlo.")
def solicitar_eliminar_cuenta(data: DeleteAccountRequest, user: User = Depends(get_current_user)):
    return request_account_deletion(user, data.password)


@router.get("/eliminar-cuenta/confirmar/{token}", summary="Confirmar eliminación de la cuenta",
            description="Completa la eliminación: anonimiza los datos y desactiva el usuario. Enlace de un solo uso con expiración.")
def confirmar_eliminar_cuenta(token: str):
    return confirm_account_deletion(token)