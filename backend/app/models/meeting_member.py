from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class MeetingMember(Base):
    __tablename__ = "meeting_members"
    __table_args__ = (
        UniqueConstraint("meeting_id", "user_id", name="uq_meeting_members"),
        Index("idx_meeting_members_user", "user_id"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    meeting_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("meetings.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    role: Mapped[str] = mapped_column(String(10), nullable=False, default="member")
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    meeting: Mapped["Meeting"] = relationship("Meeting", back_populates="members")
    user: Mapped["User"] = relationship("User")
