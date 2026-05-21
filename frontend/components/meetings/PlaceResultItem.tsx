"use client";

import {
  ListContent,
  ListDetail,
  ListItem,
  ListTitle,
} from "@seed-design/react";

import type { Place } from "@/lib/types/place";

interface PlaceResultItemProps {
  place: Place;
  selected: boolean;
  onSelect: () => void;
}

export function PlaceResultItem({
  place,
  selected,
  onSelect,
}: PlaceResultItemProps) {
  const hasMeetings = place.meetingCount > 0;
  const subline = [place.address, place.distance].filter(Boolean).join(" · ");
  const ratingText =
    place.avgRating != null ? ` · ⭐${place.avgRating.toFixed(1)}` : "";

  return (
    <ListItem
      onClick={onSelect}
      aria-selected={selected}
      style={{
        background: selected
          ? "rgba(255, 111, 15, 0.08)"
          : "var(--seed-color-bg-layer-default)",
        borderLeft: selected
          ? "3px solid var(--carrot-primary, #ff6f0f)"
          : "3px solid transparent",
        transition: "background 0.15s ease, border-color 0.15s ease",
      }}
    >
      <ListContent>
        <ListTitle
          style={
            selected
              ? { color: "var(--carrot-primary, #ff6f0f)" }
              : undefined
          }
        >
          {place.name}
        </ListTitle>
        <ListDetail>
          <span
            style={{
              display: "block",
              color: "var(--seed-color-fg-neutral-subtle)",
            }}
          >
            {subline}
          </span>
          {hasMeetings ? (
            <span
              style={{
                display: "block",
                marginTop: "var(--seed-dimension-x1)",
                color: "var(--carrot-primary, #ff6f0f)",
                fontSize: "var(--seed-font-size-t3)",
                fontWeight: "var(--seed-font-weight-medium)",
              }}
            >
              이 가게에서 모임 {place.meetingCount}건 다녀감{ratingText}
            </span>
          ) : null}
        </ListDetail>
      </ListContent>
    </ListItem>
  );
}
