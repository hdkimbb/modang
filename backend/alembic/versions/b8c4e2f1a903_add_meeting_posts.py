"""add meeting_posts

Revision ID: b8c4e2f1a903
Revises: 6d3fe6013cd0
Create Date: 2026-05-22 10:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "b8c4e2f1a903"
down_revision: Union[str, None] = "6d3fe6013cd0"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "meeting_posts",
        sa.Column("meeting_id", sa.String(length=32), nullable=False),
        sa.Column("author_user_id", sa.String(length=32), nullable=False),
        sa.Column("board_type", sa.String(length=20), nullable=False, server_default="free"),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("image_urls", sa.String(length=4000), nullable=True),
        sa.Column("view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("like_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("comment_count", sa.Integer(), nullable=False, server_default="0"),
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
        sa.ForeignKeyConstraint(["author_user_id"], ["users.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["meeting_id"], ["meetings.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_meeting_posts_meeting",
        "meeting_posts",
        ["meeting_id"],
        unique=False,
    )
    op.create_index(
        "idx_meeting_posts_meeting_board",
        "meeting_posts",
        ["meeting_id", "board_type"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_meeting_posts_meeting_board", table_name="meeting_posts")
    op.drop_index("idx_meeting_posts_meeting", table_name="meeting_posts")
    op.drop_table("meeting_posts")
