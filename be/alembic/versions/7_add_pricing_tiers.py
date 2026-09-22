"""Add pricing_tiers table with the 4 peak/off-peak rate schedules

Revision ID: 7
Revises: 6
Create Date: 2026-08-27

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "7"
down_revision: Union[str, None] = "6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "pricing_tiers",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("day_type", sa.String(), nullable=False),
        sa.Column("start_time", sa.Time(), nullable=False),
        sa.Column("end_time", sa.Time(), nullable=False),
        sa.Column("price_min", sa.Float(), nullable=False),
        sa.Column("price_max", sa.Float(), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("notes", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_pricing_tiers_id", "pricing_tiers", ["id"], unique=False)
    op.create_index("ix_pricing_tiers_day_type", "pricing_tiers", ["day_type"], unique=False)

    # Franjas globales (aplican a todas las canchas). El precio a cobrar es el
    # punto medio del rango informado.
    tiers = [
        {
            "name": "Valle (Lunes a Viernes)",
            "day_type": "weekday",
            "start_time": "08:00",
            "end_time": "16:00",
            "price_min": 55000,
            "price_max": 80000,
            "price": 67500,
            "notes": "8:00 a.m. - 4:00 p.m. Ideal para universitarios o empresas.",
            "is_active": True,
        },
        {
            "name": "Pico (Lunes a Viernes)",
            "day_type": "weekday",
            "start_time": "17:00",
            "end_time": "23:00",
            "price_min": 110000,
            "price_max": 180000,
            "price": 145000,
            "notes": "5:00 p.m. - 11:00 p.m. Mayor demanda. Incluye iluminación.",
            "is_active": True,
        },
        {
            "name": "Sábados Todo el Día",
            "day_type": "saturday",
            "start_time": "07:00",
            "end_time": "22:00",
            "price_min": 100000,
            "price_max": 150000,
            "price": 125000,
            "notes": "7:00 a.m. - 10:00 p.m. Alta ocupación, requiere reserva previa.",
            "is_active": True,
        },
        {
            "name": "Domingos y Festivos",
            "day_type": "sunday_holiday",
            "start_time": "08:00",
            "end_time": "18:00",
            "price_min": 80000,
            "price_max": 120000,
            "price": 100000,
            "notes": "8:00 a.m. - 6:00 p.m. Ambiente familiar y torneos locales.",
            "is_active": True,
        },
    ]
    prices = sa.table(
        "pricing_tiers",
        sa.column("name", sa.String),
        sa.column("day_type", sa.String),
        sa.column("start_time", sa.Time),
        sa.column("end_time", sa.Time),
        sa.column("price_min", sa.Float),
        sa.column("price_max", sa.Float),
        sa.column("price", sa.Float),
        sa.column("notes", sa.String),
        sa.column("is_active", sa.Boolean),
    )
    op.bulk_insert(prices, tiers)


def downgrade() -> None:
    op.drop_index("ix_pricing_tiers_day_type", table_name="pricing_tiers")
    op.drop_index("ix_pricing_tiers_id", table_name="pricing_tiers")
    op.drop_table("pricing_tiers")