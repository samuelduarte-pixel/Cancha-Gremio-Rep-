"""Add payment_status column to reservations table

Revision ID: 2
Revises: 1fcb60a43ae9
Create Date: 2024-06-26

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


revision: str = "2"
down_revision: Union[str, None] = "1fcb60a43ae9"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("reservations", sa.Column("payment_status", sa.String(), nullable=False, server_default="pending"))


def downgrade() -> None:
    op.drop_column("reservations", "payment_status")
