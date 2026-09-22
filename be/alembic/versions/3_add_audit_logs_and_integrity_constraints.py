"""Add audit_logs, uniqueness and integrity constraints

Revision ID: 3
Revises: 2
Create Date: 2026-08-27

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3'
down_revision: Union[str, None] = '2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Tabla de auditoría de acciones críticas
    op.create_table('audit_logs',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('table_name', sa.String(), nullable=False),
    sa.Column('record_id', sa.Integer(), nullable=True),
    sa.Column('action', sa.String(), nullable=False),
    sa.Column('details', sa.Text(), nullable=True),
    sa.Column('performed_by', sa.String(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_id'), 'audit_logs', ['id'], unique=False)

    # Control de duplicidad e integridad de valores
    op.create_unique_constraint('uq_fields_name', 'fields', ['name'])
    op.create_check_constraint('ck_users_role', 'users', "role IN ('CLIENT', 'ADMIN')")
    op.create_check_constraint('ck_reservations_status', 'reservations', "status IN ('pending', 'confirmed', 'cancelled')")
    op.create_check_constraint('ck_reservations_payment_status', 'reservations', "payment_status IN ('pending', 'paid', 'cancelled', 'refunded')")
    op.create_check_constraint('ck_events_event_type', 'events', "event_type IN ('MAINTENANCE', 'TOURNAMENT', 'LEAGUE', 'SPECIAL', 'PRIVATE_EVENT')")


def downgrade() -> None:
    op.drop_constraint('ck_events_event_type', 'events', type_='check')
    op.drop_constraint('ck_reservations_payment_status', 'reservations', type_='check')
    op.drop_constraint('ck_reservations_status', 'reservations', type_='check')
    op.drop_constraint('ck_users_role', 'users', type_='check')
    op.drop_constraint('uq_fields_name', 'fields', type_='unique')
    op.drop_index(op.f('ix_audit_logs_id'), table_name='audit_logs')
    op.drop_table('audit_logs')