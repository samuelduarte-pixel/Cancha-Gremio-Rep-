# ¿Qué? Dependencias FastAPI que protegen rutas con autenticación y roles
# ¿Para qué? Garantizar que solo usuarios autenticados/administradores accedan a rutas sensibles
# ¿Impacto? Seguridad: verificación de token JWT, blacklist y rol ADMIN en cada request

from fastapi import Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.security import decode_token, is_blacklisted


def extract_bearer(authorization: str = Header(default="")) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="No autenticado: falta el token")
    token = authorization.replace("Bearer ", "") if authorization.startswith("Bearer ") else authorization
    if not token or token.isspace():
        raise HTTPException(status_code=401, detail="Token vacío")
    return token


def get_current_user(token: str = Depends(extract_bearer), db: Session = Depends(get_db)) -> User:
    payload = decode_token(token, "access")
    if is_blacklisted(db, payload.get("jti", "")):
        raise HTTPException(status_code=401, detail="Sesión inválida: token revocado")
    user = db.query(User).filter(User.id == int(payload.get("sub", 0))).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Usuario no válido o inactivo")
    # Cerrar sesión en todos los dispositivos invalida los tokens anteriores
    if int(payload.get("ver", 0)) != (user.session_version or 0):
        raise HTTPException(status_code=401, detail="Sesión cerrada en todos los dispositivos")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "ADMIN":
        raise HTTPException(status_code=403, detail="Acceso denegado: se requieren permisos de administrador")
    return user