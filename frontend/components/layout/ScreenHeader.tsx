"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";

import { NavigationTop } from "@/components/common/NavigationTop";

type ScreenHeaderVariant = "close" | "back";

interface ScreenHeaderProps {
  variant: ScreenHeaderVariant;
  title?: string;
  onAction: () => void;
  rightSlot?: ReactNode;
  divider?: boolean;
}

/** @deprecated Prefer NavigationTop directly */
export function ScreenHeader({
  variant,
  title,
  onAction,
  rightSlot,
  divider = false,
}: ScreenHeaderProps) {
  const leftItem =
    variant === "close" ? (
      <button
        type="button"
        onClick={onAction}
        className="flex items-center p-0 text-seed-gray-900"
        aria-label="닫기"
      >
        <X size={24} strokeWidth={2} aria-hidden />
      </button>
    ) : undefined;

  return (
    <NavigationTop
      variant="sub"
      title={title}
      onBack={variant === "back" ? onAction : undefined}
      leftItem={leftItem}
      rightItems={rightSlot ? [rightSlot] : []}
      divider={divider}
    />
  );
}
