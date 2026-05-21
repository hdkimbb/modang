"""add_place_owner_message

Revision ID: 13a060ce7178
Revises: 9f4da4856e76
Create Date: 2026-05-21 15:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "13a060ce7178"
down_revision: Union[str, None] = "9f4da4856e76"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {c["name"] for c in inspector.get_columns("places")}

    if "owner_message" not in columns:
        op.add_column(
            "places",
            sa.Column("owner_message", sa.String(length=100), nullable=True),
        )
    if "owner_message_active" not in columns:
        op.add_column(
            "places",
            sa.Column(
                "owner_message_active",
                sa.Boolean(),
                nullable=False,
                server_default=sa.false(),
            ),
        )


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {c["name"] for c in inspector.get_columns("places")}

    if "owner_message_active" in columns:
        op.drop_column("places", "owner_message_active")
    if "owner_message" in columns:
        op.drop_column("places", "owner_message")
