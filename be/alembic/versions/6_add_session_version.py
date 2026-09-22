"""Add session_version to users for logout-all-devices

Revision ID: 6
Revises: 5
Create Date: 2026-08-27

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "6"
down_revision: Union[str, None] = "5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Versión de sesión: al incrementarla se invalidan todos los JWT emitidos antes
    op.add_column("users", sa.Column("session_version", sa.Integer(), nullable=False, server_default="0"))


def downgrade() -> None:
    op.drop_column("users", "session_version")