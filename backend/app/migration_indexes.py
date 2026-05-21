"""Dialect-aware partial indexes for Alembic migrations."""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

_EXTERNAL_WHERE = sa.text(
    "external_provider IS NOT NULL AND external_id IS NOT NULL",
)


def create_uq_places_external() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        op.create_index(
            "uq_places_external",
            "places",
            ["external_provider", "external_id"],
            unique=True,
            sqlite_where=_EXTERNAL_WHERE,
        )
    else:
        op.create_index(
            "uq_places_external",
            "places",
            ["external_provider", "external_id"],
            unique=True,
            postgresql_where=_EXTERNAL_WHERE,
        )


def drop_uq_places_external() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "sqlite":
        op.drop_index(
            "uq_places_external",
            table_name="places",
            sqlite_where=_EXTERNAL_WHERE,
        )
    else:
        op.drop_index("uq_places_external", table_name="places")
