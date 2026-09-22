# ¿Qué? Configuración centralizada usando Pydantic Settings
# ¿Para qué? Leer variables de entorno de forma tipada y validada
# ¿Impacto? Sin esto no hay forma segura de manejar credenciales

from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_minutes: int = 10080  # 7 días
    confirmation_token_expire_hours: int = 24  # Enlace de confirmación de registro
    reset_token_expire_minutes: int = 60       # Token de recuperación de contraseña
    max_login_attempts: int = 5
    lock_minutes: int = 15
    # CORS: lista separada por comas. "*" permite todo (solo desarrollo).
    cors_origins: str = "*"
    # SMTP opcional: si no está configurado, se usa modo dev (se devuelve el enlace en la respuesta).
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    mail_from: str = "no-reply@canchagremio.local"
    https_redirect: bool = False  # Forzar HTTPS en producción
    debug: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        if self.cors_origins.strip() == "*":
            return ["*"]
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    class Config:
        env_file = ".env"

settings = Settings()
