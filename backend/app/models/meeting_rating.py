from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class MeetingRating(ModelBase):
    __tablename__ = "meeting_ratings"
    __table_args__ = (
        UniqueConstraint("event_id", "user_id", name="uq_ratings_event_user"),
        Index("idx_ratings_event", "event_id"),
        Index("idx_ratings_user", "user_id"),
    )

    event_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("meeting_events.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    would_revisit: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    event: Mapped["MeetingEvent"] = relationship(
        "MeetingEvent",
        back_populates="ratings",
    )
    user: Mapped["User"] = relationship("User")
