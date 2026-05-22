"""Season and award routes (F9, F10)."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db import get_db
from app.models.award import Award
from app.models.place import Place
from app.models.place_score_snapshot import PlaceScoreSnapshot
from app.models.season import Season
from app.schemas.award import (
    AwardPlaceSummary,
    AwardTriggerResponse,
    PlaceAwardItem,
    PlaceAwardsResponse,
    SeasonAwardGroup,
    SeasonAwardWinner,
    SeasonAwardsResponse,
    SeasonSummary,
)
from app.services.award_service import calculate_and_award_season, count_season_awards

router = APIRouter(prefix="/api/v1", tags=["awards"])


def _season_summary(db: Session, season: Season) -> SeasonSummary:
    return SeasonSummary(
        id=season.id,
        name=season.name,
        starts_at=season.starts_at,
        ends_at=season.ends_at,
        status=season.status,
        total_awards=count_season_awards(db, season.id),
    )


@router.post("/seasons/{season_id}/award", response_model=AwardTriggerResponse)
def trigger_season_award(
    season_id: str,
    db: Session = Depends(get_db),
) -> AwardTriggerResponse:
    try:
        result = calculate_and_award_season(season_id, db)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    return AwardTriggerResponse(**result)


@router.get("/seasons", response_model=list[SeasonSummary])
def list_seasons(db: Session = Depends(get_db)) -> list[SeasonSummary]:
    seasons = db.scalars(
        select(Season).order_by(Season.ends_at.desc()),
    ).all()
    return [_season_summary(db, s) for s in seasons]


@router.get("/seasons/{season_id}/awards", response_model=SeasonAwardsResponse)
def get_season_awards(
    season_id: str,
    db: Session = Depends(get_db),
) -> SeasonAwardsResponse:
    season = db.get(Season, season_id)
    if season is None:
        raise HTTPException(status_code=404, detail="Season not found")

    awards = db.scalars(
        select(Award)
        .where(Award.season_id == season_id)
        .order_by(Award.category.asc(), Award.district.asc(), Award.rank.asc()),
    ).all()

    snap_map: dict[tuple[str, str, str], PlaceScoreSnapshot] = {}
    if awards:
        snaps = db.scalars(
            select(PlaceScoreSnapshot).where(
                PlaceScoreSnapshot.season_id == season_id,
            ),
        ).all()
        for snap in snaps:
            snap_map[(snap.place_id, snap.category, snap.district)] = snap

    groups_dict: dict[tuple[str, str], list[SeasonAwardWinner]] = {}
    for award in awards:
        place = db.get(Place, award.place_id)
        if place is None:
            continue
        snap = snap_map.get((award.place_id, award.category, award.district))
        signal_count = snap.signal_count if snap else 0
        winner = SeasonAwardWinner(
            rank=award.rank,
            place=AwardPlaceSummary(
                id=place.id,
                name=place.name,
                address=place.address,
                district=place.district,
                category=place.category,
            ),
            score=award.score,
            signal_count=signal_count,
        )
        key = (award.category, award.district)
        groups_dict.setdefault(key, []).append(winner)

    groups = [
        SeasonAwardGroup(category=cat, district=dist, winners=winners)
        for (cat, dist), winners in sorted(groups_dict.items())
    ]

    return SeasonAwardsResponse(
        season=_season_summary(db, season),
        groups=groups,
    )


@router.get("/places/{place_id}/awards", response_model=PlaceAwardsResponse)
def get_place_awards(
    place_id: str,
    db: Session = Depends(get_db),
) -> PlaceAwardsResponse:
    if db.get(Place, place_id) is None:
        raise HTTPException(status_code=404, detail="Place not found")

    rows = db.execute(
        select(Award, Season)
        .join(Season, Season.id == Award.season_id)
        .where(Award.place_id == place_id)
        .order_by(Season.ends_at.desc(), Award.rank.asc()),
    ).all()

    items = [
        PlaceAwardItem(
            season=_season_summary(db, season),
            rank=award.rank,
            category=award.category,
            district=award.district,
            score=award.score,
        )
        for award, season in rows
    ]
    return PlaceAwardsResponse(items=items)
