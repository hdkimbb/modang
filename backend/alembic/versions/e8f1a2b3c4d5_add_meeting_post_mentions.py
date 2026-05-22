"""add meeting_posts.mentions

Revision ID: e8f1a2b3c4d5
Revises: c7a1b2d3e4f5
Create Date: 2026-05-22 18:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "e8f1a2b3c4d5"
down_revision: Union[str, None] = "c7a1b2d3e4f5"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "meeting_posts",
        sa.Column("mentions", sa.String(length=1000), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("meeting_posts", "mentions")
