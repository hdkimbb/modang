"""add seasons awards snapshots

Revision ID: a1b2c3d4e5f6
Revises: e8f1a2b3c4d5
Create Date: 2026-05-22 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "e8f1a2b3c4d5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "seasons",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "place_score_snapshots",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("season_id", sa.String(length=32), nullable=False),
        sa.Column("place_id", sa.String(length=32), nullable=False),
        sa.Column("category", sa.String(length=30), nullable=False),
        sa.Column("district", sa.String(length=50), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column("signal_count", sa.Integer(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["season_id"], ["seasons.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "season_id",
            "place_id",
            "category",
            "district",
            name="uq_snapshot_season_place_category_district",
        ),
    )
    op.create_index(
        "idx_snapshots_season",
        "place_score_snapshots",
        ["season_id"],
        unique=False,
    )
    op.create_index(
        "idx_snapshots_place",
        "place_score_snapshots",
        ["place_id"],
        unique=False,
    )

    op.create_table(
        "awards",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("season_id", sa.String(length=32), nullable=False),
        sa.Column("place_id", sa.String(length=32), nullable=False),
        sa.Column("category", sa.String(length=30), nullable=False),
        sa.Column("district", sa.String(length=50), nullable=False),
        sa.Column("rank", sa.Integer(), nullable=False),
        sa.Column("score", sa.Float(), nullable=False),
        sa.Column(
            "awarded_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("(CURRENT_TIMESTAMP)"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["place_id"], ["places.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["season_id"], ["seasons.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint(
            "season_id",
            "place_id",
            "category",
            "district",
            name="uq_award_season_place_category_district",
        ),
    )
    op.create_index("idx_awards_season", "awards", ["season_id"], unique=False)
    op.create_index("idx_awards_place", "awards", ["place_id"], unique=False)


def downgrade() -> None:
    op.drop_index("idx_awards_place", table_name="awards")
    op.drop_index("idx_awards_season", table_name="awards")
    op.drop_table("awards")
    op.drop_index("idx_snapshots_place", table_name="place_score_snapshots")
    op.drop_index("idx_snapshots_season", table_name="place_score_snapshots")
    op.drop_table("place_score_snapshots")
    op.drop_table("seasons")
