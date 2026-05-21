from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class PlaceRecommendationTarget(ModelBase):
    __tablename__ = "place_recommendation_targets"
    __table_args__ = (
        UniqueConstraint("place_id", "category", name="uq_prt_place_category"),
    )

    place_id: Mapped[str] = mapped_column(
        String(32),
        ForeignKey("places.id", ondelete="CASCADE"),
        nullable=False,
    )
    category: Mapped[str] = mapped_column(String(30), nullable=False)

    place: Mapped["Place"] = relationship("Place", back_populates="recommendation_targets")
