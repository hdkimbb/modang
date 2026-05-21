from sqlalchemy import Float, Index, String, text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class Place(ModelBase):
    __tablename__ = "places"
    __table_args__ = (
        Index("idx_places_district_category", "district", "category"),
        Index("idx_places_business", "business_id"),
        Index(
            "uq_places_external",
            "external_provider",
            "external_id",
            unique=True,
            sqlite_where=text(
                "external_provider IS NOT NULL AND external_id IS NOT NULL",
            ),
        ),
    )

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    address: Mapped[str] = mapped_column(String(255), nullable=False)
    lat: Mapped[float] = mapped_column(Float, nullable=False)
    lng: Mapped[float] = mapped_column(Float, nullable=False)
    district: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    business_id: Mapped[str | None] = mapped_column(String(32), nullable=True)
    external_provider: Mapped[str | None] = mapped_column(String(20), nullable=True)
    external_id: Mapped[str | None] = mapped_column(String(100), nullable=True)

    signals: Mapped[list["PlaceSignal"]] = relationship(
        "PlaceSignal",
        back_populates="place",
    )
