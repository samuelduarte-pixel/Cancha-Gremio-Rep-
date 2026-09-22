"""Apply checklist improvements: uniqueness, integrity, audit triggers, views

Agrega las mejoras pendientes del checklist de base de datos:

1. Control de duplicidad (UNIQUE en users.email y users.phone)
2. Integridad referencial / validación (CHECK end_time > start_time en reservas)
3. Trigger anti-solapamiento de reservas (evita doble reserva en misma cancha/horario)
4. Trigger de auditoría automática en reservations -> audit_logs
5. Índices de rendimiento adicionales
6. Vistas agregadas para reportes

Revision ID: 8
Revises: 7
Create Date: 2026-08-31
"""
from typing import Sequence, Union
from alembic import op


# revision identifiers, used by Alembic.
revision: str = "8"
down_revision: Union[str, None] = "7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # ----------------------------------------------------------
    # 1. CONTROL DE DUPLICIDAD
    # UNIQUE en email y phone de users (evita clientes duplicados).
    # Si existen duplicados previos, se debe limpiar antes; la FK del
    # handler de IntegrityError ya cubre el caso 409.
    # ----------------------------------------------------------
    op.create_unique_constraint("uq_users_email", "users", ["email"])
    op.create_unique_constraint("uq_users_phone", "users", ["phone"])

    # ----------------------------------------------------------
    # 2. VALIDACIÓN DE DATOS (integridad)
    # La reserva no puede terminar antes de empezar.
    # ----------------------------------------------------------
    op.create_check_constraint(
        "ck_reservations_time_range",
        "reservations",
        "end_time > start_time",
    )
    op.create_check_constraint(
        "ck_reservations_total_price",
        "reservations",
        "total_price >= 0",
    )

    # ----------------------------------------------------------
    # 3. TRIGGER ANTI-SOLAPAMIENTO
    # Impide reservar la misma cancha en el mismo horario (regla crítica
    # de negocio para evitar la duplicidad de reservas).
    # ----------------------------------------------------------
    op.execute(
        """
        CREATE OR REPLACE FUNCTION prevent_reservation_overlap()
        RETURNS TRIGGER AS $$
        BEGIN
            IF EXISTS (
                SELECT 1 FROM reservations
                WHERE field_id = NEW.field_id
                  AND status IN ('pending', 'confirmed')
                  AND id <> COALESCE(NEW.id, -1)
                  AND NEW.start_time < end_time
                  AND NEW.end_time > start_time
            ) THEN
                RAISE EXCEPTION 'La cancha ya está reservada en ese horario';
            END IF;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        DROP TRIGGER IF EXISTS trg_reservations_no_overlap ON reservations;
        CREATE TRIGGER trg_reservations_no_overlap
        BEFORE INSERT OR UPDATE OF start_time, end_time, field_id ON reservations
        FOR EACH ROW
        EXECUTE FUNCTION prevent_reservation_overlap();
        """
    )

    # ----------------------------------------------------------
    # 4. AUDITORÍA AUTOMÁTICA
    # Registra automáticamente cada CREATE/UPDATE/DELETE en reservations
    # dentro de audit_logs, con el usuario que ejecutó la acción.
    # Asegura que created_at siempre se rellene con la hora actual.
    # ----------------------------------------------------------
    op.execute("ALTER TABLE audit_logs ALTER COLUMN created_at SET DEFAULT now();")
    op.execute(
        """
        CREATE OR REPLACE FUNCTION audit_reservations()
        RETURNS TRIGGER AS $$
        DECLARE
            v_user TEXT;
        BEGIN
            BEGIN
                v_user := current_setting('request.jwt.claims', true)::jsonb->>'email';
            EXCEPTION WHEN OTHERS THEN
                v_user := NULL;
            END;

            IF TG_OP = 'INSERT' THEN
                INSERT INTO audit_logs (table_name, record_id, action, details, performed_by)
                VALUES ('reservations', NEW.id, 'CREATE',
                    jsonb_build_object(
                        'field_id', NEW.field_id,
                        'client_email', NEW.client_email,
                        'client_name', NEW.client_name,
                        'start_time', NEW.start_time,
                        'end_time', NEW.end_time,
                        'total_price', NEW.total_price,
                        'status', NEW.status,
                        'payment_status', NEW.payment_status
                    )::text,
                    v_user);
            ELSIF TG_OP = 'UPDATE' THEN
                INSERT INTO audit_logs (table_name, record_id, action, details, performed_by)
                VALUES ('reservations', NEW.id, 'UPDATE',
                    jsonb_build_object(
                        'status_old', OLD.status, 'status_new', NEW.status,
                        'payment_status_old', OLD.payment_status,
                        'payment_status_new', NEW.payment_status,
                        'start_time_old', OLD.start_time, 'start_time_new', NEW.start_time,
                        'total_price_old', OLD.total_price, 'total_price_new', NEW.total_price
                    )::text,
                    v_user);
            ELSIF TG_OP = 'DELETE' THEN
                INSERT INTO audit_logs (table_name, record_id, action, details, performed_by)
                VALUES ('reservations', OLD.id, 'DELETE',
                    jsonb_build_object(
                        'field_id', OLD.field_id,
                        'client_email', OLD.client_email,
                        'client_name', OLD.client_name,
                        'start_time', OLD.start_time
                    )::text,
                    v_user);
            END IF;
            RETURN COALESCE(NEW, OLD);
        END;
        $$ LANGUAGE plpgsql;
        """
    )
    op.execute(
        """
        DROP TRIGGER IF EXISTS trg_audit_reservations ON reservations;
        CREATE TRIGGER trg_audit_reservations
        AFTER INSERT OR UPDATE OR DELETE ON reservations
        FOR EACH ROW EXECUTE FUNCTION audit_reservations();
        """
    )

    # ----------------------------------------------------------
    # 5. ÍNDICES DE RENDIMIENTO ADICIONALES
    # ----------------------------------------------------------
    op.create_index(
        "ix_reservations_user_id", "reservations", ["user_id"], unique=False
    )
    op.create_index(
        "ix_reservations_client_email", "reservations", ["client_email"], unique=False
    )
    op.create_index(
        "ix_reservations_payment_status", "reservations", ["payment_status"], unique=False
    )
    op.create_index(
        "ix_events_field_id", "events", ["field_id"], unique=False
    )

    # ----------------------------------------------------------
    # 6. VISTAS AGREGADAS PARA REPORTES (checklist punto 4)
    # ----------------------------------------------------------
    op.execute(
        """
        CREATE OR REPLACE VIEW v_reservas_detalle AS
        SELECT
            r.id,
            r.field_id,
            f.name AS cancha,
            r.client_name,
            r.client_email,
            r.client_phone,
            COALESCE(u.name, 'Invitado') AS usuario_registrado,
            r.start_time,
            r.end_time,
            r.total_price,
            r.status,
            r.payment_status
        FROM reservations r
        LEFT JOIN fields f ON f.id = r.field_id
        LEFT JOIN users u ON u.id = r.user_id;
        """
    )
    op.execute(
        """
        CREATE OR REPLACE VIEW v_ingresos_mensuales AS
        SELECT
            DATE_TRUNC('month', r.start_time) AS mes,
            COUNT(*) AS total_reservas,
            SUM(r.total_price) AS ingresos,
            SUM(CASE WHEN r.payment_status = 'paid' THEN r.total_price ELSE 0 END) AS ingresos_cobrados
        FROM reservations r
        WHERE r.status <> 'cancelled'
        GROUP BY DATE_TRUNC('month', r.start_time)
        ORDER BY mes DESC;
        """
    )
    op.execute(
        """
        CREATE OR REPLACE VIEW v_ocupacion_canchas AS
        SELECT
            f.name AS cancha,
            DATE(r.start_time) AS dia,
            COUNT(*) AS horas_reservadas,
            SUM(r.total_price) AS ventas
        FROM reservations r
        JOIN fields f ON f.id = r.field_id
        WHERE r.status IN ('pending', 'confirmed', 'completed')
        GROUP BY f.name, DATE(r.start_time)
        ORDER BY dia DESC, ventas DESC;
        """
    )


def downgrade() -> None:
    # Vistas
    op.execute("DROP VIEW IF EXISTS v_reservas_detalle;")
    op.execute("DROP VIEW IF EXISTS v_ingresos_mensuales;")
    op.execute("DROP VIEW IF EXISTS v_ocupacion_canchas;")

    # Índices
    op.drop_index("ix_events_field_id", table_name="events")
    op.drop_index("ix_reservations_payment_status", table_name="reservations")
    op.drop_index("ix_reservations_client_email", table_name="reservations")
    op.drop_index("ix_reservations_user_id", table_name="reservations")

    # Triggers
    op.execute("DROP TRIGGER IF EXISTS trg_audit_reservations ON reservations;")
    op.execute("DROP FUNCTION IF EXISTS audit_reservations();")
    op.execute("DROP TRIGGER IF EXISTS trg_reservations_no_overlap ON reservations;")
    op.execute("DROP FUNCTION IF EXISTS prevent_reservation_overlap();")

    # Constraints
    op.drop_constraint("ck_reservations_total_price", "reservations", type_="check")
    op.drop_constraint("ck_reservations_time_range", "reservations", type_="check")
    op.drop_constraint("uq_users_phone", "users", type_="unique")
    op.drop_constraint("uq_users_email", "users", type_="unique")
