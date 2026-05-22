from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin
from app.services.mentions import dump_mentions, parse_mentions_raw


class MeetingPostComment(Base, TimestampMixin):
    __tablename__ = "meeting_post_comments"
    __table_args__ = (
        Index("idx_post_comments_post", "post_id"),
        Index("idx_post_comments_author", "author_user_id"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    post_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("meeting_posts.id", ondelete="CASCADE"),
        nullable=False,
    )
    author_user_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    _mentions: Mapped[str | None] = mapped_column("mentions", String(500), nullable=True)

    post: Mapped["MeetingPost"] = relationship("MeetingPost", back_populates="comments")
    author: Mapped["User"] = relationship("User", foreign_keys=[author_user_id])

    @hybrid_property
    def mentions(self) -> dict[str, list[str]]:
        return parse_mentions_raw(self._mentions)

    @mentions.setter
    def mentions(self, value: dict[str, list[str]] | list[str] | None) -> None:
        if value is None:
            self._mentions = None
        elif isinstance(value, list):
            self._mentions = dump_mentions(value, [])
        else:
            self._mentions = dump_mentions(
                value.get("places"),
                value.get("users"),
            )

    @property
    def mention_place_ids(self) -> list[str]:
        return self.mentions["places"]

    @property
    def mention_user_ids(self) -> list[str]:
        return self.mentions["users"]
