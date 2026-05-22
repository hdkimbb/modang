from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, Index, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base


class Award(Base):
    __tablename__ = "awards"
    __table_args__ = (
        UniqueConstraint(
            "season_id",
            "place_id",
            "category",
            "district",
            name="uq_award_season_place_category_district",
        ),
        Index("idx_awards_season", "season_id"),
        Index("idx_awards_place", "place_id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    season_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("seasons.id", ondelete="CASCADE"),
        nullable=False,
    )
    place_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("places.id", ondelete="CASCADE"),
        nullable=False,
    )
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    district: Mapped[str] = mapped_column(String(50), nullable=False)
    rank: Mapped[int] = mapped_column(Integer, nullable=False)
    score: Mapped[float] = mapped_column(Float, nullable=False)
    awarded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    season: Mapped["Season"] = relationship("Season", back_populates="awards")
    place: Mapped["Place"] = relationship("Place")
