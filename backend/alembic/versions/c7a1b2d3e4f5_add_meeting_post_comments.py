"""add meeting_post_comments

Revision ID: c7a1b2d3e4f5
Revises: b8c4e2f1a903
Create Date: 2026-05-22 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c7a1b2d3e4f5"
down_revision: Union[str, None] = "b8c4e2f1a903"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "meeting_post_comments",
        sa.Column("id", sa.String(length=32), nullable=False),
        sa.Column("post_id", sa.String(length=32), nullable=False),
        sa.Column("author_user_id", sa.String(length=32), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("mentions", sa.String(length=500), nullable=True),
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
        sa.ForeignKeyConstraint(["post_id"], ["meeting_posts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "idx_post_comments_post",
        "meeting_post_comments",
        ["post_id"],
        unique=False,
    )
    op.create_index(
        "idx_post_comments_author",
        "meeting_post_comments",
        ["author_user_id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("idx_post_comments_author", table_name="meeting_post_comments")
    op.drop_index("idx_post_comments_post", table_name="meeting_post_comments")
    op.drop_table("meeting_post_comments")
