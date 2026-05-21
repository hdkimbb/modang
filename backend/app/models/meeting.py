from sqlalchemy import ForeignKey, Index, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class Meeting(ModelBase):
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
