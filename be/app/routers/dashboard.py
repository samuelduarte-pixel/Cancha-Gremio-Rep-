import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.dependencies import require_admin
from app.models.reservation import Reservation
from app.models.user import User
from app.models.event import Event
from app.models.field import Field
from datetime import datetime, date

# Toda la sección de dashboard es para administradores
router = APIRouter(prefix="/dashboard", tags=["dashboard"], dependencies=[Depends(require_admin)])

ESTADOS_VALIDOS = {"pending", "confirmed", "cancelled"}


def _build_reporte_query(db: Session, year: int, month: int,
                          field_id: int | None = None, estado: str | None = None):
    if not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="El mes debe estar entre 1 y 12")
    if not (2000 <= year <= 2100):
        raise HTTPException(status_code=400, detail="El año debe estar entre 2000 y 2100")
    if estado and estado not in ESTADOS_VALIDOS:
        raise HTTPException(status_code=400, detail=f"Estado inválido: {estado}")

    desde = datetime(year, month, 1)
    hasta = datetime(year + (1 if month == 12 else 0), (1 if month == 12 else month + 1), 1)

    query = db.query(Reservation).filter(
        Reservation.start_time >= desde,
        Reservation.start_time < hasta,
    )
    if field_id:
        query = query.filter(Reservation.field_id == field_id)
    if estado:
        query = query.filter(Reservation.status == estado)
    return query, desde


@router.get("/stats", summary="Estadísticas del dashboard",
            description="KPIs para el home: reservas hoy, ingresos por día/mes, pendientes, ocupación promedio, clientes y próximos eventos.")
def get_dashboard_stats(db: Session = Depends(get_db)):
    today = date.today()
    start_of_today = datetime.combine(today, datetime.min.time())
    end_of_today = datetime.combine(today, datetime.max.time())

    start_of_month = datetime(today.year, today.month, 1)

    total_hoy = db.query(func.count(Reservation.id)).filter(
        Reservation.start_time >= start_of_today,
        Reservation.start_time <= end_of_today
    ).scalar() or 0

    ingresos_dia = db.query(func.coalesce(func.sum(Reservation.total_price), 0)).filter(
        Reservation.start_time >= start_of_today,
        Reservation.start_time <= end_of_today,
        Reservation.status == "confirmed"
    ).scalar()

    ingresos_mes = db.query(func.coalesce(func.sum(Reservation.total_price), 0)).filter(
        Reservation.start_time >= start_of_month,
        Reservation.status == "confirmed"
    ).scalar()

    pendientes = db.query(func.count(Reservation.id)).filter(
        Reservation.status == "pending"
    ).scalar() or 0

    clientes = db.query(func.count(User.id)).filter(
        User.role == "CLIENT"
    ).scalar() or 0

    eventos = db.query(func.count(Event.id)).filter(
        Event.start_time >= datetime.now(),
        Event.event_type != "MAINTENANCE"
    ).scalar() or 0

    horas_ocupadas = db.query(
        func.coalesce(func.sum(func.extract("epoch", Reservation.end_time - Reservation.start_time) / 3600), 0)
    ).filter(
        Reservation.start_time >= start_of_today,
        Reservation.start_time <= end_of_today,
        Reservation.status == "confirmed"
    ).scalar()

    horas_disponibles = 0
    for f in db.query(Field).filter(Field.is_active == True).all():
        try:
            h_start = int(f.available_hour_start.split(":")[0])
            h_end = int(f.available_hour_end.split(":")[0])
            horas_disponibles += max(h_end - h_start, 0)
        except (ValueError, AttributeError):
            horas_disponibles += 24

    ocupacion = 0.0
    if horas_disponibles and horas_ocupadas:
        ocupacion = round(min(float(horas_ocupadas) / horas_disponibles * 100, 100), 1)

    return {
        "totalReservasHoy": total_hoy,
        "ingresosDia": round(float(ingresos_dia or 0), 2),
        "ingresosMes": round(float(ingresos_mes or 0), 2),
        "reservasPendientes": pendientes,
        "ocupacionPromedio": ocupacion,
        "clientesRegistrados": clientes,
        "proximosEventos": eventos
    }


@router.get("/reporte", summary="Reporte parametrizado de reservas",
            description="Devuelve las reservas de un mes con filtros opcionales por cancha y estado, más un resumen agregado (ingresos, totales).")
def get_reporte(
    year: int = Query(..., description="Año del reporte"),
    month: int = Query(..., description="Mes del reporte (1-12)"),
    field_id: int | None = Query(default=None, description="Filtrar por cancha"),
    estado: str | None = Query(default=None, description="Filtrar por estado: pending, confirmed, cancelled"),
    db: Session = Depends(get_db),
):
    query, desde = _build_reporte_query(db, year, month, field_id, estado)
    reservas = query.order_by(Reservation.start_time.asc()).all()

    total_ingresos = sum(r.total_price for r in reservas if r.status == "confirmed")
    nombre_mes = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
                  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"][month]

    return {
        "periodo": {"year": year, "month": month, "mes": nombre_mes, "desde": desde.strftime("%Y-%m-%d")},
        "filtros": {"field_id": field_id, "estado": estado},
        "resumen": {
            "total_reservas": len(reservas),
            "confirmadas": sum(1 for r in reservas if r.status == "confirmed"),
            "pendientes": sum(1 for r in reservas if r.status == "pending"),
            "canceladas": sum(1 for r in reservas if r.status == "cancelled"),
            "ingresos_confirmados": round(total_ingresos, 2),
        },
        "reservas": [
            {
                "id": r.id,
                "cancha": r.field_id,
                "cliente": r.client_name,
                "email": r.client_email,
                "telefono": r.client_phone,
                "inicio": r.start_time.isoformat(),
                "fin": r.end_time.isoformat(),
                "precio": r.total_price,
                "estado": r.status,
                "pago": r.payment_status,
            }
            for r in reservas
        ],
    }


@router.get("/export", summary="Exportar reporte a CSV",
            description="Genera un CSV descargable con las reservas del mes (filtrable por cancha y estado).")
def export_report(
    year: int = Query(..., description="Año del reporte"),
    month: int = Query(..., description="Mes del reporte (1-12)"),
    field_id: int | None = Query(default=None, description="Filtrar por cancha"),
    estado: str | None = Query(default=None, description="Filtrar por estado"),
    db: Session = Depends(get_db),
):
    query, _ = _build_reporte_query(db, year, month, field_id, estado)
    reservas = query.order_by(Reservation.start_time.asc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)
    writer.writerow(["ID", "Cancha", "Cliente", "Email", "Teléfono", "Inicio", "Fin", "Precio", "Estado", "Pago"])
    for r in reservas:
        writer.writerow([
            r.id, r.field_id, r.client_name, r.client_email, r.client_phone,
            r.start_time.strftime("%Y-%m-%d %H:%M"), r.end_time.strftime("%Y-%m-%d %H:%M"),
            r.total_price, r.status, r.payment_status,
        ])

    buffer.seek(0)
    filename = f"reporte-{year}-{month:02d}.csv"
    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv; charset=utf-8",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )