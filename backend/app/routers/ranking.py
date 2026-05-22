"""District × category ranking routes."""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.ranking import (
    RankingFiltersResponse,
    RankingItem,
    RankingPlaceStats,
    RankingPlaceSummary,
    RankingResponse,
    RankingScoreBreakdown,
)
from app.services.ranking import (
    current_season_label,
    fetch_ranking,
    fetch_ranking_categories,
    fetch_ranking_districts,
)

router = APIRouter(prefix="/api/v1/ranking", tags=["ranking"])


@router.get("/filters", response_model=RankingFiltersResponse)
def get_ranking_filters(db: Session = Depends(get_db)) -> RankingFiltersResponse:
    return RankingFiltersResponse(
        districts=fetch_ranking_districts(db),
        categories=fetch_ranking_categories(db),
    )


@router.get("", response_model=RankingResponse)
def get_ranking(
    district: Annotated[str, Query(min_length=1, description="동네 (예: 성수동)")],
    category: Annotated[str, Query(min_length=1, description="카테고리 (예: cafe)")],
    limit: Annotated[int, Query(ge=1, le=50)] = 10,
    db: Session = Depends(get_db),
) -> RankingResponse:
    rows = fetch_ranking(db, district.strip(), category.strip(), limit=limit)
    items = [
        RankingItem(
            rank=row["rank"],
            place=RankingPlaceSummary(
                place_id=row["place_id"],
                name=row["name"],
                thumbnail_url=None,
            ),
            score=RankingScoreBreakdown(
                total=row["total"],
                meetup_signal=row["meetup_signal"],
                mention=row["mention"],
                review=row["review"],
            ),
            stats=RankingPlaceStats(
                total_meetings_30d=row["total_meetings_30d"],
                avg_rating=row["avg_rating"],
            ),
        )
        for row in rows
    ]
    return RankingResponse(
        district=district.strip(),
        category=category.strip(),
        season_label=current_season_label(),
        items=items,
    )
