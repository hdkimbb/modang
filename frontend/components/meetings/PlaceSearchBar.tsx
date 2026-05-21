"use client";

import { TextFieldInput, TextFieldRoot } from "@seed-design/react";

interface PlaceSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      style={{ color: "var(--seed-color-fg-neutral-muted)" }}
    >
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path
        d="M20 20L16 16"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PlaceSearchBar({ value, onChange }: PlaceSearchBarProps) {
  return (
    <div
      style={{
        padding:
          "var(--seed-dimension-x3) var(--seed-dimension-spacing-x-global-gutter)",
      }}
    >
      <TextFieldRoot variant="outline" size="medium">
        <span
          className="flex items-center pl-3"
          style={{ color: "var(--seed-color-fg-neutral-muted)" }}
        >
          <SearchIcon />
        </span>
        <TextFieldInput
          placeholder="장소명으로 검색"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-label="장소 검색"
        />
      </TextFieldRoot>
    </div>
  );
}
