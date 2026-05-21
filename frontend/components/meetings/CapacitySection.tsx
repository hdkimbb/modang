"use client";

import { TextFieldInput, TextFieldRoot } from "@seed-design/react";

import { useEventDraft } from "@/context/EventDraftContext";

export function CapacitySection() {
  const { capacity, setCapacity } = useEventDraft();

  const step = (delta: number) => setCapacity(capacity + delta);

  return (
    <div
      className="flex items-center gap-3"
      style={{
        padding:
          "var(--seed-dimension-x3) var(--seed-dimension-spacing-x-global-gutter) var(--seed-dimension-x4)",
      }}
    >
      <TextFieldRoot variant="outline" size="medium" style={{ flex: 1 }}>
        <TextFieldInput
          type="number"
          min={2}
          max={99}
          value={String(capacity)}
          onChange={(e) => setCapacity(Number(e.target.value) || 2)}
          aria-label="인원"
        />
      </TextFieldRoot>
      <span
        style={{
          fontSize: "var(--seed-font-size-t5)",
          color: "var(--seed-color-fg-neutral-subtle)",
        }}
      >
        명
      </span>
      <div className="flex gap-2">
        <StepButton label="−" onClick={() => step(-1)} />
        <StepButton label="+" onClick={() => step(1)} />
      </div>
    </div>
  );
}

function StepButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label === "+" ? "인원 늘리기" : "인원 줄이기"}
      style={{
        width: "var(--seed-dimension-x10)",
        height: "var(--seed-dimension-x10)",
        borderRadius: "var(--seed-radius-r2)",
        border: "1px solid var(--seed-color-stroke-neutral-muted)",
        background: "var(--seed-color-bg-layer-default)",
        fontSize: "var(--seed-font-size-t6)",
        color: "var(--seed-color-fg-neutral)",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}
