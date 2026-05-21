from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Index,
    JSON,
    String,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class PlaceSignal(Base):
    __tablename__ = "place_signals"
    __table_args__ = (
        Index("idx_signals_place_time", "place_id", "occurred_at"),
        Index("idx_signals_type", "signal_type", "is_void"),
        Index("idx_signals_source", "source_ref"),
        Index("idx_signals_user", "user_id"),
    )

    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    place_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("places.id", ondelete="RESTRICT"),
        nullable=False,
    )
    signal_type: Mapped[str] = mapped_column(String(20), nullable=False)
    weight: Mapped[float] = mapped_column(Float, nullable=False)
    source_ref: Mapped[str | None] = mapped_column(String(50), nullable=True)
    user_id: Mapped[str | None] = mapped_column(
        String(32),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    occurred_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
    is_void: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    meta: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    place: Mapped["Place"] = relationship("Place", back_populates="signals")
    user: Mapped["User | None"] = relationship("User", back_populates="signals")
