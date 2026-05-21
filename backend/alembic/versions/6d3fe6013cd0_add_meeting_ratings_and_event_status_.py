"""add_meeting_ratings_and_event_status_data

Revision ID: 6d3fe6013cd0
Revises: f45fc2afa906
Create Date: 2026-05-21 16:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "6d3fe6013cd0"
down_revision: Union[str, None] = "f45fc2afa906"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "meeting_ratings",
        sa.Column("event_id", sa.String(length=32), nullable=False),
        sa.Column("user_id", sa.String(length=32), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("would_revisit", sa.Boolean(), nullable=False, server_default=sa.false()),
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
        sa.ForeignKeyConstraint(["event_id"], ["meeting_events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "user_id", name="uq_ratings_event_user"),
    )
    op.create_index("idx_ratings_event", "meeting_ratings", ["event_id"], unique=False)
    op.create_index("idx_ratings_user", "meeting_ratings", ["user_id"], unique=False)

    op.execute(
        """
        UPDATE meeting_events
        SET status = 'ended'
        WHERE scheduled_at < datetime('now')
        """,
    )
    op.execute(
        """
        UPDATE meeting_events
        SET status = 'scheduled'
        WHERE scheduled_at >= datetime('now')
        """,
    )


def downgrade() -> None:
    op.drop_index("idx_ratings_user", table_name="meeting_ratings")
    op.drop_index("idx_ratings_event", table_name="meeting_ratings")
    op.drop_table("meeting_ratings")
