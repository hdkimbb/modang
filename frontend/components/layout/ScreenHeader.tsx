"use client";

import type { ReactNode } from "react";

type ScreenHeaderVariant = "close" | "back";

interface ScreenHeaderProps {
  variant: ScreenHeaderVariant;
  title?: string;
  onAction: () => void;
  rightSlot?: ReactNode;
}

export function ScreenHeader({
  variant,
  title,
  onAction,
  rightSlot,
}: ScreenHeaderProps) {
  return (
    <header
      className="flex shrink-0 items-center gap-2"
      style={{
        height: "var(--seed-dimension-x11)",
        paddingLeft: "var(--seed-dimension-spacing-x-global-gutter)",
        paddingRight: "var(--seed-dimension-spacing-x-global-gutter)",
        background: "var(--seed-color-bg-layer-default)",
      }}
    >
      <button
        type="button"
        onClick={onAction}
        aria-label={variant === "close" ? "닫기" : "뒤로"}
        className="flex shrink-0 items-center justify-center border-none bg-transparent p-0"
        style={{
          width: "var(--seed-dimension-x10)",
          height: "var(--seed-dimension-x10)",
          color: "var(--seed-color-fg-neutral)",
          fontSize: "var(--seed-font-size-t6)",
          fontWeight: "var(--seed-font-weight-regular)",
          cursor: "pointer",
        }}
      >
        {variant === "close" ? "×" : "‹"}
      </button>
      {title ? (
        <h1
          className="min-w-0 flex-1 truncate text-center"
          style={{
            fontSize: "var(--seed-font-size-t6)",
            lineHeight: "var(--seed-line-height-t6)",
            fontWeight: "var(--seed-font-weight-bold)",
            color: "var(--seed-color-fg-neutral)",
          }}
        >
          {title}
        </h1>
      ) : (
        <div className="flex-1" />
      )}
      {title ? (
        <div
          className="shrink-0"
          style={{ width: "var(--seed-dimension-x10)" }}
        >
          {rightSlot}
        </div>
      ) : (
        rightSlot ?? null
      )}
    </header>
  );
}
