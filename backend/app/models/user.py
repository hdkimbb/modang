from sqlalchemy import Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import ModelBase


class User(ModelBase):
    __tablename__ = "users"
    __table_args__ = (Index("idx_users_region", "region"),)

    name: Mapped[str] = mapped_column(String(50), nullable=False)
    region: Mapped[str] = mapped_column(String(50), nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    signals: Mapped[list["PlaceSignal"]] = relationship(
        "PlaceSignal",
        back_populates="user",
    )
