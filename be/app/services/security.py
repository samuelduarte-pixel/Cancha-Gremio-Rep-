# ¿Qué? Utilidades de seguridad: tokens JWT, blacklist y tokens de verificación
# ¿Para qué? Centralizar emisión, validación e invalidación de tokens
# ¿Impacto? Permite cumplir el checklist de seguridad (expiración, refresh, logout)

import hashlib
import logging
import secrets
import uuid
from datetime import datetime, timedelta

from fastapi import HTTPException
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.auth_token import AuthToken
from app.models.token_blacklist import TokenBlacklist

logger = logging.getLogger("cancha_gremio")


def hash_token(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


def generate_token() -> str:
    return secrets.token_urlsafe(32)


def encode_token(subject, token_type: str, expires_minutes: int, extra: dict | None = None):
    """Emite un JWT con expiración (exp), id único (jti), tipo (access/refresh) y datos extra."""
    jti = uuid.uuid4().hex
    now = datetime.utcnow()
    payload = {
        "sub": str(subject),
        "type": token_type,
        "jti": jti,
        "iat": now,
        "exp": now + timedelta(minutes=expires_minutes),
    }
    if extra:
        payload.update(extra)
    token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    return token, payload


def decode_token(token: str, expected_type: str) -> dict:
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    if payload.get("type") != expected_type:
        raise HTTPException(status_code=401, detail="Tipo de token no válido")
    return payload


def is_blacklisted(db: Session, jti: str) -> bool:
    return db.query(TokenBlacklist).filter(TokenBlacklist.jti == jti).first() is not None


def blacklist_token(db: Session, jti: str, expires_at, user_id=None):
    """Invalida un token (logout)."""
    db.add(TokenBlacklist(jti=jti, user_id=user_id, expires_at=expires_at))
    db.commit()


# ------------------------------------------------------------------
# Tokens de correo (verificación de registro y recuperación de contraseña)
# ------------------------------------------------------------------

def issue_auth_token(db: Session, user_id: int, token_type: str, expires_minutes: int) -> str:
    raw = generate_token()
    db.add(AuthToken(
        user_id=user_id,
        token=hash_token(raw),
        token_type=token_type,
        expires_at=datetime.utcnow() + timedelta(minutes=expires_minutes),
    ))
    db.commit()
    return raw


def consume_auth_token(db: Session, raw: str, token_type: str) -> AuthToken:
    """Valida que el enlace exista, no haya expirado y no se haya usado (uso único)."""
    row = db.query(AuthToken).filter(
        AuthToken.token == hash_token(raw),
        AuthToken.token_type == token_type,
    ).first()
    if not row:
        raise HTTPException(status_code=401, detail="Enlace inválido")
    if row.used_at is not None:
        raise HTTPException(status_code=400, detail="Este enlace ya fue utilizado")
    if row.expires_at < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Este enlace ha expirado")
    row.used_at = datetime.utcnow()
    db.commit()
    return row


def revoke_auth_tokens(db: Session, user_id: int, token_type: str):
    """Marca como usados todos los tokens pendientes de un usuario (rotación)."""
    db.query(AuthToken).filter(
        AuthToken.user_id == user_id,
        AuthToken.token_type == token_type,
        AuthToken.used_at.is_(None),
    ).update({"used_at": datetime.utcnow()})
    db.commit()


# ------------------------------------------------------------------
# Correo (SMTP opcional; modo dev devuelve el enlace en la respuesta)
# ------------------------------------------------------------------

def send_email(to: str, subject: str, body_text: str = "", body_html: str = ""):
    if settings.smtp_host:
        # En producción con SMTP configurado se enviaría el correo real.
        logger.warning("SMTP configurado pero no implementado; enlace no se mostrará en la API.")
        return
    # Modo desarrollo: se loguea el correo simulado.
    logger.info("EMAIL [dev] para %s -> %s", to, subject)