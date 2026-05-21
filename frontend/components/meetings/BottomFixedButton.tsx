"use client";

import { ActionButton } from "@seed-design/react";

interface BottomFixedButtonProps {
  label: string;
  onClick: () => void;
  variant?: "neutralSolid" | "brandSolid";
  disabled?: boolean;
}

export function BottomFixedButton({
  label,
  onClick,
  variant = "neutralSolid",
  disabled = false,
}: BottomFixedButtonProps) {
  return (
    <div
      className="shrink-0"
      style={{
        padding:
          "var(--seed-dimension-x4) var(--seed-dimension-spacing-x-global-gutter)",
        paddingBottom:
          "calc(var(--seed-dimension-x4) + var(--seed-safe-area-bottom))",
        background: "var(--seed-color-bg-layer-default)",
        borderTop: "1px solid var(--seed-color-stroke-neutral-subtle)",
      }}
    >
      <ActionButton
        variant={variant}
        size="large"
        onClick={onClick}
        disabled={disabled}
        style={{ width: "100%" }}
      >
        {label}
      </ActionButton>
    </div>
  );
}
