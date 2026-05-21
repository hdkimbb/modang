"""add_user_role_and_owned_place

Revision ID: 9f4da4856e76
Revises: a3656de5e3c1
Create Date: 2026-05-21 14:55:31.986209

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "9f4da4856e76"
down_revision: Union[str, None] = "a3656de5e3c1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {c["name"] for c in inspector.get_columns("users")}

    if "role" not in columns:
        op.add_column(
            "users",
            sa.Column("role", sa.String(length=20), nullable=False, server_default="user"),
        )
    if "owned_place_id" not in columns:
        op.add_column(
            "users",
            sa.Column("owned_place_id", sa.String(length=32), nullable=True),
        )

    # SQLite cannot ALTER ADD CONSTRAINT; FK is enforced at ORM level for dev.


def downgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {c["name"] for c in inspector.get_columns("users")}

    if "owned_place_id" in columns:
        op.drop_column("users", "owned_place_id")
    if "role" in columns:
        op.drop_column("users", "role")
