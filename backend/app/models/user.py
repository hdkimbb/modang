from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class User(ModelBase):
    __tablename__ = "users"
    __table_args__ = (Index("idx_users_region", "region"),)

    name: Mapped[str] = mapped_column(String(50), nullable=False)
    region: Mapped[str] = mapped_column(String(50), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="user")
    owned_place_id: Mapped[str | None] = mapped_column(
        String(32),
        ForeignKey("places.id", ondelete="SET NULL"),
        nullable=True,
    )

    owned_place: Mapped["Place | None"] = relationship(
        "Place",
        foreign_keys=[owned_place_id],
    )
    signals: Mapped[list["PlaceSignal"]] = relationship(
        "PlaceSignal",
        back_populates="user",
    )
