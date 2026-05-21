"use client";

import { ActionButton } from "@seed-design/react";

import type { Place } from "@/lib/types/place";

interface PlaceSelectionSheetProps {
  place: Place;
  onConfirm: () => void;
}

export function PlaceSelectionSheet({
  place,
  onConfirm,
}: PlaceSelectionSheetProps) {
  return (
    <div
      className="shrink-0"
      style={{
        padding:
          "var(--seed-dimension-x4) var(--seed-dimension-spacing-x-global-gutter)",
        paddingBottom:
          "calc(var(--seed-dimension-x4) + var(--seed-safe-area-bottom))",
        background: "var(--seed-color-bg-layer-default)",
        boxShadow: "0 -4px 16px rgba(0,0,0,0.08)",
      }}
    >
      <p
        style={{
          fontSize: "var(--seed-font-size-t6)",
          fontWeight: "var(--seed-font-weight-bold)",
          marginBottom: "var(--seed-dimension-x1)",
        }}
      >
        {place.name}
      </p>
      <p
        style={{
          fontSize: "var(--seed-font-size-t4)",
          color: "var(--seed-color-fg-neutral-subtle)",
          marginBottom: "var(--seed-dimension-x4)",
        }}
      >
        {place.address}
      </p>
      <ActionButton
        variant="brandSolid"
        size="large"
        onClick={onConfirm}
        style={{ width: "100%", background: "var(--carrot-primary, #ff6f0f)" }}
      >
        선택
      </ActionButton>
    </div>
  );
}
