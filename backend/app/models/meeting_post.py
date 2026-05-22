import json

from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase
from app.services.mentions import dump_mentions, parse_mentions_raw


class MeetingPost(ModelBase):
    __tablename__ = "meeting_posts"
    __table_args__ = (
        Index("idx_meeting_posts_meeting", "meeting_id"),
        Index("idx_meeting_posts_meeting_board", "meeting_id", "board_type"),
    )

    meeting_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
    )
    author_user_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    board_type: Mapped[str] = mapped_column(String(20), nullable=False, default="free")
    content: Mapped[str] = mapped_column(Text, nullable=False)
    _image_urls: Mapped[str | None] = mapped_column("image_urls", String(4000), nullable=True)
    view_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    like_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    _mentions: Mapped[str | None] = mapped_column("mentions", String(1000), nullable=True)

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="posts")
    author: Mapped["User"] = relationship("User", foreign_keys=[author_user_id])
    comments: Mapped[list["MeetingPostComment"]] = relationship(
        "MeetingPostComment",
        back_populates="post",
    )

    @hybrid_property
    def image_urls(self) -> list[str]:
        if not self._image_urls:
            return []
        try:
            data = json.loads(self._image_urls)
        except json.JSONDecodeError:
            return []
        if isinstance(data, list):
            return [str(url) for url in data if url]
        return []

    @image_urls.setter
    def image_urls(self, value: list[str] | None) -> None:
        if not value:
            self._image_urls = None
        else:
            self._image_urls = json.dumps(value)

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
