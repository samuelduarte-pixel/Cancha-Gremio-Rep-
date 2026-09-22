"""Add performance indexes to reservations and events tables

Revision ID: 4
Revises: 3
Create Date: 2026-08-27

"""
from typing import Sequence, Union
from alembic import op


revision: str = "4"
down_revision: Union[str, None] = "3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Índices para consultas frecuentes y detección de conflictos de horario
    op.create_index("ix_reservations_field_id_start_time", "reservations", ["field_id", "start_time"])
    op.create_index("ix_reservations_status", "reservations", ["status"])
    op.create_index("ix_events_field_id_start_time", "events", ["field_id", "start_time"])
    op.create_index("ix_events_event_type", "events", ["event_type"])
    op.create_index("ix_users_role", "users", ["role"])


def downgrade() -> None:
    op.drop_index("ix_reservations_field_id_start_time", table_name="reservations")
    op.drop_index("ix_reservations_status", table_name="reservations")
    op.drop_index("ix_events_field_id_start_time", table_name="events")
    op.drop_index("ix_events_event_type", table_name="events")
    op.drop_index("ix_users_role", table_name="users")