from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class Meeting(ModelBase):
    # TODO(Phase E): add thumbnail_url when 모임 만들기 image upload ships
    __tablename__ = "meetings"
    __table_args__ = (
        Index("idx_meetings_host", "host_user_id"),
        Index("idx_meetings_district_category", "district", "category"),
    )

    host_user_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("users.id", ondelete="RESTRICT"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    district: Mapped[str] = mapped_column(String(50), nullable=False)
    activity_range: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    member_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    host: Mapped["User"] = relationship("User", foreign_keys=[host_user_id])
    members: Mapped[list["MeetingMember"]] = relationship(
        "MeetingMember",
        back_populates="meeting",
    )
    events: Mapped[list["MeetingEvent"]] = relationship(
        "MeetingEvent",
        back_populates="meeting",
    )
