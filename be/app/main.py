# ¿Qué? Punto de entrada principal de la aplicación FastAPI
# ¿Para qué? Inicializa el servidor y registra todos los routers
# ¿Impacto? Sin este archivo el servidor no puede arrancar
from app.config import settings
from app.routers import auth, reservations, fields, events, maintenance, dashboard, clientes, pricing
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import IntegrityError
import logging

logger = logging.getLogger("cancha_gremio")

app = FastAPI(
    title="Cancha Gremio API",
    description="Sistema de reservas para cancha sintética. "
                "Documentación autogenerada: autenticación, reservas, canchas, eventos y mantenimientos.",
    version="1.0.0",
    redirect_slashes=True,
    openapi_tags=[
        {"name": "Auth", "description": "Autenticación y gestión de cuenta (login, registro, confirmación y recuperación)."},
        {"name": "reservations", "description": "CRUD de reservas de canchas con reglas de negocio."},
        {"name": "fields", "description": "CRUD de canchas y horarios operativos."},
        {"name": "eventos", "description": "CRUD de eventos y bloqueos de horario."},
        {"name": "mantenimiento", "description": "CRUD de mantenimientos."},
        {"name": "dashboard", "description": "Estadísticas en vivo y reportes parametrizados."},
        {"name": "clientes", "description": "Administración de clientes (admin)."},
        {"name": "tarifas", "description": "Tarifas por franja horaria (valle/pico/fin de semana) para el cálculo de precios."},
    ],
)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Agrega cabeceras de seguridad básicas a todas las respuestas."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "no-referrer"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'"
        )
        return response


if settings.https_redirect:
    @app.middleware("http")
    async def https_redirect_middleware(request: Request, call_next):
        if request.url.scheme == "http" and request.method in ("GET", "HEAD"):
            url = request.url.replace(scheme="https")
            return JSONResponse(status_code=301, headers={"Location": str(url)}, content={"detail": "Redirigiendo a HTTPS"})
        return await call_next(request)


app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=settings.cors_origins != "*",
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(IntegrityError)
async def integrity_error_handler(request: Request, exc: IntegrityError):
    logger.exception("Violación de integridad en la base de datos: %s", exc)
    return JSONResponse(
        status_code=409,
        content={"detail": "La operación viola una regla de integridad de la base de datos (dato duplicado o referenciado)."},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Error no controlado en %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content={"detail": "Ocurrió un error interno del servidor. Inténtalo de nuevo o contacta al administrador."},
    )


app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth-Alias"])
app.include_router(reservations.router)
app.include_router(fields.router)
app.include_router(events.router)
app.include_router(maintenance.router)
app.include_router(dashboard.router)
app.include_router(clientes.router)
app.include_router(pricing.router)


@app.get("/", summary="Health raíz")
def read_root():
    return {"message": "Cancha Gremio API funcionando correctamente"}


@app.get("/api/v1/health", summary="Verificar estado del servicio")
def health_check():
    return {"status": "ok"}