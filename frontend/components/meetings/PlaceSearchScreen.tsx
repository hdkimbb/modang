"use client";

import { ListRoot } from "@seed-design/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { useEventDraft } from "@/context/EventDraftContext";
import { filterPlaces } from "@/lib/mocks/places";
import type { Place } from "@/lib/types/place";

import { PlaceEmptyState } from "./PlaceEmptyState";
import { PlaceResultItem } from "./PlaceResultItem";
import { PlaceSearchBar } from "./PlaceSearchBar";
import { PlaceSelectionSheet } from "./PlaceSelectionSheet";

export function PlaceSearchScreen() {
  const router = useRouter();
  const { setPlace } = useEventDraft();
  const [query, setQuery] = useState("");
  const [pendingPlace, setPendingPlace] = useState<Place | null>(null);

  const results = useMemo(() => filterPlaces(query), [query]);
  const showEmpty = query.trim().length === 0;

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
          <PlaceEmptyState />
        ) : results.length === 0 ? (
          <p
            className="px-4 py-8 text-center"
            style={{
              fontSize: "var(--seed-font-size-t4)",
              color: "var(--seed-color-fg-neutral-subtle)",
            }}
          >
            검색 결과가 없어요.
          </p>
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
