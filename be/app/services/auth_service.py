# ¿Qué? Servicio de autenticación: registro, login, confirmación, recuperación y refresh
# ¿Para qué? Lógica de negocio de seguridad sobre los tokens con expiración y rotación
# ¿Impacto? Seguridad: verificación de correo, bloqueo por intentos y logout real

import bcrypt
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.services import security
from app.services.audit import write_audit

ALLOWED_SPECIAL = set("@$!%*?&#._-")
MIN_PASSWORD_LENGTH = 8


def validate_password(password: str):
    errors = []
    if len(password) < MIN_PASSWORD_LENGTH:
        errors.append(f"Mínimo {MIN_PASSWORD_LENGTH} caracteres")

    invalid_chars = set()
    for ch in password:
        if ch.isalnum():
            continue
        if ch in ALLOWED_SPECIAL:
            continue
        invalid_chars.add(ch)

    if invalid_chars:
        chars_str = ", ".join(repr(c) for c in sorted(invalid_chars))
        errors.append(f"Caracteres no permitidos: {chars_str}")
        errors.append(f"Caracteres especiales permitidos: {''.join(sorted(ALLOWED_SPECIAL))}")

    if errors:
        raise HTTPException(status_code=400, detail=" | ".join(errors))


def _serialize_user(user: User) -> dict:
    return {
        "id_usuario": user.id,
        "nombre": user.name,
        "apellido": "",
        "correo": user.email,
        "telefono": user.phone or "",
        "id_rol": 1 if user.role == "ADMIN" else 2,
        "nombre_rol": "admin" if user.role == "ADMIN" else "cliente",
        "correo_verificado": bool(user.is_verified),
    }


def _issue_tokens(db: Session, user_id: int, version: int = 0) -> dict:
    extra = {"ver": version}
    access, a_payload = security.encode_token(
        user_id, "access", settings.access_token_expire_minutes, extra=extra
    )
    refresh, r_payload = security.encode_token(
        user_id, "refresh", settings.refresh_token_expire_minutes, extra=extra
    )
    return {
        "token": access,  # compat con FE actual
        "access_token": access,
        "refresh_token": refresh,
        "expires_at": a_payload["exp"],
        "refresh_expires_at": r_payload["exp"],
    }


def login_user(data):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email.ilike(data.correo)).first()
        # No revelar si el correo existe: mismo mensaje genérico
        if not user:
            raise HTTPException(status_code=401, detail="Credenciales incorrectas")

        # Bloqueo temporal por intentos fallidos
        now = security.datetime.utcnow()
        if user.locked_until and user.locked_until > now:
            minutes_left = int((user.locked_until - now).total_seconds() // 60) + 1
            raise HTTPException(
                status_code=423,
                detail=f"Cuenta bloqueada temporalmente por intentos fallidos. Intenta en {minutes_left} min.",
            )

        password_hash = user.password.encode("utf-8") if isinstance(user.password, str) else user.password
        if not bcrypt.checkpw(data.password.encode("utf-8"), password_hash):
            user.failed_attempts = (user.failed_attempts or 0) + 1
            if user.failed_attempts >= settings.max_login_attempts:
                user.locked_until = now + security.timedelta(minutes=settings.lock_minutes)
                user.failed_attempts = 0
                db.commit()
                raise HTTPException(
                    status_code=423,
                    detail=f"Demasiados intentos fallidos. Cuenta bloqueada {settings.lock_minutes} minutos.",
                )
            db.commit()
            attempts_left = settings.max_login_attempts - user.failed_attempts
            raise HTTPException(
                status_code=401,
                detail=f"Credenciales incorrectas. Intentos restantes: {attempts_left}.",
            )

        # Éxito: resetear contadores de bloqueo
        user.failed_attempts = 0
        user.locked_until = None
        db.commit()

        if not user.is_verified:
            raise HTTPException(
                status_code=403,
                detail="Correo no confirmado. Revisa tu bandeja de entrada para completar el registro.",
            )

        tokens = _issue_tokens(db, user.id, user.session_version or 0)
        tokens["usuario"] = _serialize_user(user)
        return tokens
    finally:
        db.close()


def register_user(data):
    validate_password(data.password)
    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email.ilike(data.correo)).first()
        if existing:
            raise HTTPException(status_code=400, detail="El correo ya está en uso")

        phone = data.telefono or ""
        if phone:
            existing_phone = db.query(User).filter(User.phone.isnot(None), User.phone == phone).first()
            if existing_phone:
                raise HTTPException(status_code=400, detail="El teléfono ya está en uso")

        hashed = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()

        new_user = User(
            name=data.nombre,
            email=data.correo,
            phone=data.telefono or "",
            password=hashed,
            role="CLIENT",
            is_active=True,
            is_verified=True,  # Cuenta activa de inmediato: no exige confirmación de correo
            failed_attempts=0,
            locked_until=None,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        write_audit(db, "users", new_user.id, "CREATE_REGISTER", "Nuevo registro de cliente (cuenta activa sin confirmación de correo)", performed_by=new_user.email)

        raw = security.issue_auth_token(
            db,
            new_user.id,
            "REGISTER",
            settings.confirmation_token_expire_hours * 60,
        )
        frontend_url = "http://localhost:5173" if not settings.debug else "http://localhost:5173"
        confirmation_url = f"{frontend_url}/confirmar-correo?token={raw}"

        smtp_configured = bool(settings.smtp_host)
        security.send_email(
            new_user.email,
            "Confirma tu registro en Cancha Gremio",
            body_text=f"Completa tu registro abriendo: {confirmation_url}",
            body_html=f"<p>Completa tu registro abriendo el siguiente enlace:</p><p><a href='{confirmation_url}'>{confirmation_url}</a></p>",
        )

        body = {
            "id_usuario": new_user.id,
            "nombre": new_user.name,
            "correo": new_user.email,
            "mensaje": f"Hemos enviado un enlace de confirmación a {new_user.email}. El enlace expira en {settings.confirmation_token_expire_hours} horas.",
        }
        if not smtp_configured:
            # Modo dev: se devuelve el enlace para poder probar el flujo completo
            body["confirmation_url"] = confirmation_url
        return body
    finally:
        db.close()


def confirm_email(token: str) -> dict:
    db = SessionLocal()
    try:
        row = security.consume_auth_token(db, token, "REGISTER")
        user = db.query(User).filter(User.id == row.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        user.is_verified = True
        db.commit()
        write_audit(db, "users", user.id, "CONFIRM_EMAIL", "Correo de registro confirmado", performed_by=user.email)
        return {"message": "Correo confirmado. Ya puedes iniciar sesión."}
    finally:
        db.close()


def forgot_password(data):
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email.ilike(data.correo)).first()
        if not user:
            # No revelar existencia del correo
            return {"mensaje": "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.", "reset_url": None}

        security.revoke_auth_tokens(db, user.id, "RESET_PASSWORD")
        raw = security.issue_auth_token(
            db,
            user.id,
            "RESET_PASSWORD",
            settings.reset_token_expire_minutes,
        )
        reset_url = f"http://localhost:5173/reset-password?token={raw}"
        smtp_configured = bool(settings.smtp_host)
        security.send_email(
            user.email,
            "Recuperación de contraseña - Cancha Gremio",
            body_text=f"Restablece tu contraseña abriendo: {reset_url}",
            body_html=f"<p>Restablece tu contraseña con este enlace (válido {settings.reset_token_expire_minutes} min):</p><p><a href='{reset_url}'>{reset_url}</a></p>",
        )
        body = {
            "mensaje": f"Si el correo está registrado, recibirás un enlace válido por {settings.reset_token_expire_minutes} minutos.",
            "reset_url": None,
        }
        if not smtp_configured:
            body["reset_url"] = reset_url  # Modo dev
        return body
    finally:
        db.close()


def reset_password(token: str, data):
    validate_password(data.password)
    db = SessionLocal()
    try:
        row = security.consume_auth_token(db, token, "RESET_PASSWORD")
        user = db.query(User).filter(User.id == row.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        user.password = bcrypt.hashpw(data.password.encode(), bcrypt.gensalt()).decode()
        user.failed_attempts = 0
        user.locked_until = None
        db.commit()
        write_audit(db, "users", user.id, "RESET_PASSWORD", "Contraseña restablecida", performed_by=user.email)
        return {"message": "Contraseña actualizada. Ya puedes iniciar sesión."}
    finally:
        db.close()


def refresh_access(refresh_token: str) -> dict:
    db = SessionLocal()
    try:
        payload = security.decode_token(refresh_token, "refresh")
        jti = payload.get("jti")
        if jti and security.is_blacklisted(db, jti):
            raise HTTPException(status_code=401, detail="Sesión cerrada (token revocado)")
        user_id = int(payload.get("sub", 0))
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Usuario no válido")
        # Sesión invalidada desde otro dispositivo (logout all)
        if int(payload.get("ver", 0)) != (user.session_version or 0):
            raise HTTPException(status_code=401, detail="Sesión cerrada en todos los dispositivos")
        tokens = _issue_tokens(db, user.id, user.session_version or 0)
        tokens["usuario"] = _serialize_user(user)
        return tokens
    finally:
        db.close()


def logout_user(token: str, refresh_token: str | None = None):
    db = SessionLocal()
    try:
        # Invalidar access token
        payload = security.decode_token(token, "access")
        jti = payload.get("jti")
        if jti:
            expires_at = payload.get("exp")
            security.blacklist_token(
                db, jti,
                expires_at=security.datetime.fromtimestamp(expires_at) if expires_at else security.datetime.utcnow(),
                user_id=int(payload.get("sub", 0)) or None,
            )
        # Invalidar refresh token si viene
        if refresh_token:
            try:
                r_payload = security.decode_token(refresh_token, "refresh")
                r_jti = r_payload.get("jti")
                if r_jti:
                    r_expires = r_payload.get("exp")
                    security.blacklist_token(
                        db, r_jti,
                        expires_at=security.datetime.fromtimestamp(r_expires) if r_expires else security.datetime.utcnow(),
                        user_id=int(r_payload.get("sub", 0)) or None,
                    )
            except HTTPException:
                pass  # El refresh pudo ya expirar; no bloquea el logout
        return {"mensaje": "Sesión cerrada correctamente"}
    finally:
        db.close()


def logout_all_devices(token: str) -> str:
    """Cierra la sesión en todos los dispositivos incrementando session_version."""
    db = SessionLocal()
    try:
        payload = security.decode_token(token, "access")
        user_id = int(payload.get("sub", 0))
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        user.session_version = (user.session_version or 0) + 1
        db.commit()

        # El dispositivo actual también queda invalidado
        jti = payload.get("jti")
        if jti:
            expires_at = payload.get("exp")
            security.blacklist_token(
                db, jti,
                expires_at=security.datetime.fromtimestamp(expires_at) if expires_at else security.datetime.utcnow(),
                user_id=user.id,
            )
        write_audit(db, "users", user.id, "LOGOUT_ALL", "Sesión cerrada en todos los dispositivos", performed_by=user.email)
        return "Sesión cerrada en todos los dispositivos"
    finally:
        db.close()


def request_account_deletion(db_user: User, password: str) -> dict:
    """Solicita la eliminación de cuenta: valida la contraseña y envía un enlace de confirmación."""
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == db_user.id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        password_hash = user.password.encode("utf-8") if isinstance(user.password, str) else user.password
        if not bcrypt.checkpw(password.encode("utf-8"), password_hash):
            raise HTTPException(status_code=401, detail="Contraseña incorrecta")

        raw = security.issue_auth_token(
            db,
            user.id,
            "DELETE_ACCOUNT",
            settings.confirmation_token_expire_hours * 60,
        )
        confirmation_url = f"http://localhost:5173/eliminar-cuenta?token={raw}"

        smtp_configured = bool(settings.smtp_host)
        security.send_email(
            user.email,
            "Confirmación de eliminación de cuenta - Cancha Gremio",
            body_text=f"Si realmente deseas eliminar tu cuenta, abre el siguiente enlace (expira en {settings.confirmation_token_expire_hours} horas): {confirmation_url}",
            body_html=f"<p>Hemos recibido una solicitud para eliminar tu cuenta de Cancha Gremio.</p><p>Si realmente deseas continuar, abre este enlace (válido {settings.confirmation_token_expire_hours} horas):</p><p><a href='{confirmation_url}'>{confirmation_url}</a></p><p>Si no solicitaste esto, ignora este correo.</p>",
        )

        body = {
            "mensaje": f"Hemos enviado un enlace de confirmación a {user.email}. La eliminación solo se completa al confirmarlo.",
        }
        if not smtp_configured:
            body["confirmation_url"] = confirmation_url  # Modo dev
        return body
    finally:
        db.close()


def confirm_account_deletion(token: str) -> dict:
    """Elimina (borrado lógico) la cuenta tras confirmar el enlace por correo."""
    db = SessionLocal()
    try:
        row = security.consume_auth_token(db, token, "DELETE_ACCOUNT")
        user = db.query(User).filter(User.id == row.user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        # Anonimizar datos personales (RGPD-friendly) y desactivar la cuenta
        user.name = "Usuario eliminado"
        user.phone = ""
        user.email = f"eliminado-{user.id}@anulado.cancha"
        user.is_active = False
        user.is_verified = False
        user.session_version = (user.session_version or 0) + 1
        db.commit()

        # Revocar cualquier token pendiente y futuros refreshes
        security.revoke_auth_tokens(db, user.id, "REGISTER")
        security.revoke_auth_tokens(db, user.id, "RESET_PASSWORD")
        security.revoke_auth_tokens(db, user.id, "DELETE_ACCOUNT")

        write_audit(db, "users", user.id, "DELETE_ACCOUNT", "Cuenta eliminada (borrado lógico) y datos anonimizados", performed_by=user.email)
        return {"message": "Tu cuenta fue eliminada. Gracias por haber sido parte de Cancha Gremio."}
    finally:
        db.close()


def get_profile(token):
    db = SessionLocal()
    try:
        payload = security.decode_token(token, "access")
        jti = payload.get("jti")
        if jti and security.is_blacklisted(db, jti):
            raise HTTPException(status_code=401, detail="Token revocado")
        user = db.query(User).filter(User.id == int(payload.get("sub", 0))).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return _serialize_user(user)
    finally:
        db.close()