"""add_place_recommendation_targets

Revision ID: f45fc2afa906
Revises: 13a060ce7178
Create Date: 2026-05-21 15:49:20.614001

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "f45fc2afa906"
down_revision: Union[str, None] = "13a060ce7178"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "place_recommendation_targets",
        sa.Column("place_id", sa.String(length=32), nullable=False),
        sa.Column("category", sa.String(length=30), nullable=False),
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("place_id", "category", name="uq_prt_place_category"),
    )
    op.create_index(
        "idx_prt_place",
        "place_recommendation_targets",
        ["place_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_prt_place", table_name="place_recommendation_targets")
    op.drop_table("place_recommendation_targets")
