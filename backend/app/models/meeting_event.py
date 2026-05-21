from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class MeetingEvent(ModelBase):
    __tablename__ = "meeting_events"
    __table_args__ = (
        Index("idx_events_meeting", "meeting_id"),
        Index("idx_events_place", "place_id"),
        Index("idx_events_scheduled", "scheduled_at"),
        Index("idx_events_status", "status", "scheduled_at"),
    )

    meeting_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
    )
    place_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("places.id", ondelete="RESTRICT"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    attendee_count: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="scheduled")
    rating_dispatched_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="events")
    place: Mapped["Place"] = relationship("Place")
    ratings: Mapped[list["MeetingRating"]] = relationship(
        "MeetingRating",
        back_populates="event",
    )
