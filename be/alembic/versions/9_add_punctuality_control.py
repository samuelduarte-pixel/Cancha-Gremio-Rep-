"""Add punctuality strike control for clients

Agrega control de impuntualidad para clientes:

1. users.punctuality_strikes: contador de faltas de impuntualidad consecutivas
2. users.block_reason: motivo por el que el usuario fue inhabilitado
   (p.ej. "3 impuntualidades consecutivas")

Revision ID: 9
Revises: 8
Create Date: 2026-09-08
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9"
down_revision: Union[str, None] = "8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("users", sa.Column("punctuality_strikes", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("block_reason", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("users", "block_reason")
    op.drop_column("users", "punctuality_strikes")