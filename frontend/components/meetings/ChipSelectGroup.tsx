"use client";

import { ChipLabel, ChipRoot } from "@seed-design/react";

interface ChipSelectGroupProps {
  options: readonly string[];
  selected: string[];
  onToggle: (label: string) => void;
  showCustomInput?: boolean;
}

export function ChipSelectGroup({
  options,
  selected,
  onToggle,
  showCustomInput = true,
}: ChipSelectGroupProps) {
  return (
    <div
      className="flex flex-wrap gap-2"
      style={{
        padding:
          "0 var(--seed-dimension-spacing-x-global-gutter) var(--seed-dimension-x4)",
      }}
    >
      {options.map((label) => {
        const isSelected = selected.includes(label);
        return (
          <ChipRoot
            key={label}
            variant="outlineWeak"
            size="medium"
            type="button"
            aria-checked={isSelected}
            data-checked={isSelected ? "" : undefined}
            onClick={() => onToggle(label)}
          >
            <ChipLabel>{label}</ChipLabel>
          </ChipRoot>
        );
      })}
      {showCustomInput ? (
        <ChipRoot
          variant="outlineWeak"
          size="medium"
          type="button"
          onClick={() => {
            const value = window.prompt("직접 입력");
            if (value?.trim()) onToggle(value.trim());
          }}
        >
          <ChipLabel>+ 직접 입력</ChipLabel>
        </ChipRoot>
      ) : null}
    </div>
  );
}
