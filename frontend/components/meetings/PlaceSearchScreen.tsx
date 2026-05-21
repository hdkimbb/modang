"use client";

import { ActionButton } from "@seed-design/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { KakaoMap } from "@/components/maps/KakaoMap";
import { useEventDraft } from "@/context/EventDraftContext";
import { getRecommendedPlaces, searchPlaces } from "@/lib/api";
import type { Place } from "@/lib/types/place";

import { PlaceDetailSheet } from "./PlaceDetailSheet";
import { PlaceEmptyState } from "./PlaceEmptyState";
import { PlaceResultItem } from "./PlaceResultItem";
import { PlaceSearchBar } from "./PlaceSearchBar";
import { PlaceSelectionSheet } from "./PlaceSelectionSheet";

function PlaceResultList({
  places,
  selectedId,
  onCardPress,
}: {
  places: Place[];
  selectedId: string | null;
  onCardPress: (place: Place) => void;
}) {
  return (
    <div className="flex flex-col gap-3 px-4 pb-4">
      {places.map((place) => (
        <div key={place.id} data-place-id={place.id}>
          <PlaceResultItem
            place={place}
            selected={selectedId === place.id}
            onPress={() => onCardPress(place)}
          />
        </div>
      ))}
    </div>
  );
}

export function PlaceSearchScreen() {
  const router = useRouter();
  const params = useParams();
  const meetingId = typeof params.id === "string" ? params.id : null;
  const { setPlace, meetingCategory } = useEventDraft();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [recommended, setRecommended] = useState<Place[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlace, setPendingPlace] = useState<Place | null>(null);
  const [detailPlace, setDetailPlace] = useState<Place | null>(null);
  const [showList, setShowList] = useState(true);
  const [mapFitKey, setMapFitKey] = useState(0);
  const pendingScrollRef = useRef<HTMLDivElement | null>(null);

  const showEmpty = query.trim().length === 0;
  const hasSearchResults = !showEmpty && !loading && !error && results.length > 0;

  const handleOpenDetail = (place: Place) => {
    setDetailPlace(place);
  };

  const handleSelectFromSheet = () => {
    if (!detailPlace) return;
    setPendingPlace(detailPlace);
    setDetailPlace(null);
    if (!showList) setShowList(true);
  };

  useEffect(() => {
    if (!pendingPlace?.id || !showList) return;
    const el = pendingScrollRef.current?.querySelector(
      `[data-place-id="${pendingPlace.id}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [pendingPlace?.id, showList]);

  useEffect(() => {
    getRecommendedPlaces(2, meetingCategory)
      .then((items) => setRecommended(items))
      .catch(() => setRecommended([]))
      .finally(() => setRecommendationsLoading(false));
  }, [meetingCategory]);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      setLoading(false);
      setPendingPlace(null);
      setDetailPlace(null);
      return;
    }

    setPendingPlace(null);
    setDetailPlace(null);

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchPlaces(trimmed, meetingCategory)
        .then((items) => {
          setResults(items);
          setMapFitKey((k) => k + 1);
        })
        .catch(() => {
          setResults([]);
          setError("검색에 실패했어요. 잠시 후 다시 시도해 주세요.");
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query, meetingCategory]);

  const handleConfirm = () => {
    if (!pendingPlace) return;
    setPlace(pendingPlace);
    router.back();
  };

  const listSelectedId = pendingPlace?.id ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScreenHeader
        variant="back"
        title="장소 검색"
        onAction={() => router.back()}
      />
      <PlaceSearchBar value={query} onChange={setQuery} />

      {hasSearchResults ? (
        <>
          <KakaoMap
            places={results}
            selectedPlace={pendingPlace}
            fitAllKey={mapFitKey}
            onPlaceClick={handleOpenDetail}
          />
          <div
            className="flex shrink-0 justify-end"
            style={{
              padding:
                "var(--seed-dimension-x2) var(--seed-dimension-spacing-x-global-gutter) 0",
            }}
          >
            <ActionButton
              variant="ghost"
              size="small"
              onClick={() => setShowList((v) => !v)}
            >
              {showList ? "목록 숨기기" : "목록 보기"}
            </ActionButton>
          </div>
          {showList ? (
            <div ref={pendingScrollRef} className="min-h-0 flex-1 overflow-y-auto">
              <h3 className="px-4 pb-2 text-base font-bold text-gray-900">
                검색 결과 {results.length}개
              </h3>
              <PlaceResultList
                places={results}
                selectedId={listSelectedId}
                onCardPress={handleOpenDetail}
              />
            </div>
          ) : (
            <div className="min-h-0 flex-1" />
          )}
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          {showEmpty ? (
            <>
              {recommendationsLoading ? (
                <p
                  className="px-4 py-6 text-center"
                  style={{
                    fontSize: "var(--seed-font-size-t4)",
                    color: "var(--seed-color-fg-neutral-subtle)",
                  }}
                >
                  추천 장소 불러오는 중…
                </p>
              ) : recommended.length > 0 ? (
                <section>
                  <h3 className="px-4 pb-2 text-base font-bold text-gray-900">
                    우리 동네 인기 모임 장소
                  </h3>
                  <div ref={pendingScrollRef}>
                    <PlaceResultList
                      places={recommended}
                      selectedId={listSelectedId}
                      onCardPress={handleOpenDetail}
                    />
                  </div>
                </section>
              ) : null}
            </>
          ) : loading ? (
            <p
              className="px-4 py-8 text-center"
              style={{
                fontSize: "var(--seed-font-size-t4)",
                color: "var(--seed-color-fg-neutral-subtle)",
              }}
            >
              검색 중…
            </p>
          ) : error ? (
            <p
              className="px-4 py-8 text-center"
              style={{
                fontSize: "var(--seed-font-size-t4)",
                color: "var(--seed-color-fg-critical)",
              }}
            >
              {error}
            </p>
          ) : (
            <PlaceEmptyState />
          )}
        </div>
      )}

      {pendingPlace && !detailPlace ? (
        <PlaceSelectionSheet place={pendingPlace} onConfirm={handleConfirm} />
      ) : null}

      {detailPlace ? (
        <PlaceDetailSheet
          place={detailPlace}
          open={Boolean(detailPlace)}
          onClose={() => setDetailPlace(null)}
          onSelect={handleSelectFromSheet}
          meetingId={meetingId}
        />
      ) : null}
    </div>
  );
}
