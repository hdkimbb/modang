"use client";

import { ListRoot } from "@seed-design/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useEventDraft } from "@/context/EventDraftContext";
import { getRecommendedPlaces, searchPlaces } from "@/lib/api";
import type { Place } from "@/lib/types/place";

import { PlaceEmptyState } from "./PlaceEmptyState";
import { PlaceResultItem } from "./PlaceResultItem";
import { PlaceSearchBar } from "./PlaceSearchBar";
import { PlaceSelectionSheet } from "./PlaceSelectionSheet";

export function PlaceSearchScreen() {
  const router = useRouter();
  const { setPlace } = useEventDraft();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [recommended, setRecommended] = useState<Place[]>([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingPlace, setPendingPlace] = useState<Place | null>(null);

  const showEmpty = query.trim().length === 0;

  useEffect(() => {
    getRecommendedPlaces(2)
      .then((items) => setRecommended(items))
      .catch(() => setRecommended([]))
      .finally(() => setRecommendationsLoading(false));
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      searchPlaces(trimmed)
        .then((items) => setResults(items))
        .catch(() => {
          setResults([]);
          setError("검색에 실패했어요. 잠시 후 다시 시도해 주세요.");
        })
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleConfirm = () => {
    if (!pendingPlace) return;
    setPlace(pendingPlace);
    router.back();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScreenHeader
        variant="back"
        title="장소 검색"
        onAction={() => router.back()}
      />
      <PlaceSearchBar value={query} onChange={setQuery} />
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
                <h3
                  style={{
                    padding:
                      "var(--seed-dimension-x2) var(--seed-dimension-spacing-x-global-gutter) var(--seed-dimension-x2)",
                    fontSize: "var(--seed-font-size-t5)",
                    lineHeight: "var(--seed-line-height-t5)",
                    fontWeight: "var(--seed-font-weight-bold)",
                    color: "var(--seed-color-fg-neutral)",
                  }}
                >
                  ✨ 우리 동네 인기 모임 장소
                </h3>
                <ListRoot>
                  {recommended.map((place) => (
                    <PlaceResultItem
                      key={place.id}
                      place={place}
                      selected={pendingPlace?.id === place.id}
                      onSelect={() => setPendingPlace(place)}
                    />
                  ))}
                </ListRoot>
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
        ) : results.length === 0 ? (
          <PlaceEmptyState />
        ) : (
          <ListRoot>
            {results.map((place) => (
              <PlaceResultItem
                key={place.id}
                place={place}
                selected={pendingPlace?.id === place.id}
                onSelect={() => setPendingPlace(place)}
              />
            ))}
          </ListRoot>
        )}
      </div>
      {pendingPlace ? (
        <PlaceSelectionSheet place={pendingPlace} onConfirm={handleConfirm} />
      ) : null}
    </div>
  );
}
