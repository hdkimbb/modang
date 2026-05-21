"""add meeting activity_range and description

Revision ID: a3656de5e3c1
Revises: d5eb02d614d6
Create Date: 2026-05-21 14:41:56.114105

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = 'a3656de5e3c1'
down_revision: Union[str, None] = 'd5eb02d614d6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def _column_names(table: str) -> set[str]:
    bind = op.get_bind()
    insp = sa.inspect(bind)
    return {col["name"] for col in insp.get_columns(table)}


def upgrade() -> None:
    columns = _column_names("meetings")
    if "activity_range" not in columns:
        op.add_column(
            "meetings",
            sa.Column(
                "activity_range",
                sa.Integer(),
                nullable=False,
                server_default="1",
            ),
        )
    if "description" not in columns:
        op.add_column("meetings", sa.Column("description", sa.Text(), nullable=True))


def downgrade() -> None:
    columns = _column_names("meetings")
    if "description" in columns:
        op.drop_column("meetings", "description")
    if "activity_range" in columns:
        op.drop_column("meetings", "activity_range")
