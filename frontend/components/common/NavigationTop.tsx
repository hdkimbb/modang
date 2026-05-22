"use client";

import { ChevronDown, ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";

export type NavigationTopVariant = "main" | "sub" | "large";

export interface NavigationTopProps {
  variant?: NavigationTopVariant;
  title?: string;
  largeTitle?: string;
  leftItem?: ReactNode;
  rightItems?: ReactNode[];
  onBack?: () => void;
  onTitleClick?: () => void;
  titleExpanded?: boolean;
  divider?: boolean;
  showExpandMore?: boolean;
  className?: string;
}

function RightItems({ items }: { items: ReactNode[] }) {
  if (items.length === 0) return <div className="w-[104px] shrink-0" aria-hidden />;
  return (
    <div className="flex w-[104px] shrink-0 items-center justify-end gap-4">
      {items.map((item, i) => (
        <span key={i} className="flex shrink-0 items-center">
          {item}
        </span>
      ))}
    </div>
  );
}

function TitleText({ children }: { children: ReactNode }) {
  return (
    <span className="truncate text-lg font-bold leading-[1.35] text-seed-gray-900">
      {children}
    </span>
  );
}

function NavBarRow({
  left,
  center,
  right,
}: {
  left: ReactNode;
  center: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="relative h-[44px] w-full bg-seed-gray-00">
      <div className="absolute left-4 right-4 top-0 flex h-[44px] items-center justify-between">
        <div className="flex w-[104px] shrink-0 items-center">{left}</div>
        <div className="flex min-w-0 flex-1 items-center justify-center px-1">
          {center}
        </div>
        {right}
      </div>
    </div>
  );
}

export function NavigationTop({
  variant = "main",
  title,
  largeTitle,
  leftItem,
  rightItems = [],
  onBack,
  onTitleClick,
  titleExpanded,
  divider = false,
  showExpandMore = false,
  className = "",
}: NavigationTopProps) {
  const right = <RightItems items={rightItems} />;

  const defaultBack = onBack ? (
    <button
      type="button"
      onClick={onBack}
      className="flex items-center p-0 text-seed-gray-900"
      aria-label="뒤로"
    >
      <ChevronLeft size={24} strokeWidth={2} aria-hidden />
    </button>
  ) : null;

  const mainTitle =
    title != null ? (
      onTitleClick || showExpandMore ? (
        <button
          type="button"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onTitleClick?.();
          }}
          className="flex max-w-full items-center gap-1 text-left"
          aria-label={onTitleClick ? `${title}, 사용자 전환` : title}
          aria-expanded={titleExpanded}
        >
          <TitleText>{title}</TitleText>
          {showExpandMore ? (
            <ChevronDown size={15} className="shrink-0 text-seed-gray-600" strokeWidth={2.5} aria-hidden />
          ) : null}
        </button>
      ) : (
        <TitleText>{title}</TitleText>
      )
    ) : null;

  if (variant === "main") {
    return (
      <header className={`relative w-full shrink-0 bg-seed-gray-00 ${className}`}>
        <div className="relative h-[44px] w-full">
          <div className="absolute left-4 right-4 top-0 flex h-[44px] items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center">{mainTitle}</div>
            <div className="flex shrink-0 items-center justify-end gap-4">
              {rightItems.map((item, i) => (
                <span key={i} className="flex shrink-0 items-center">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
        {divider ? (
          <div className="absolute bottom-0 left-0 right-0 h-[0.5px] bg-seed-gray-300" aria-hidden />
        ) : null}
      </header>
    );
  }

  const subCenter =
    title != null ? (
      <h1 className="truncate text-center text-lg font-bold leading-[1.35] text-seed-gray-900">
        {title}
      </h1>
    ) : (
      <span className="sr-only">제목 없음</span>
    );

  const subBar = (
    <NavBarRow
      left={leftItem ?? defaultBack ?? <span className="w-[24px]" aria-hidden />}
      center={subCenter}
      right={right}
    />
  );

  if (variant === "large") {
    return (
      <header className={`relative w-full shrink-0 bg-seed-gray-00 ${className}`}>
        {subBar}
        {largeTitle != null ? (
          <div className="px-4 pb-[6px] pt-3">
            <p className="text-2xl font-bold leading-[1.35] text-seed-gray-900">
              {largeTitle}
            </p>
          </div>
        ) : null}
        {divider ? (
          <div className="h-[0.5px] w-full bg-seed-gray-300" aria-hidden />
        ) : null}
      </header>
    );
  }

  return (
    <header className={`relative w-full shrink-0 bg-seed-gray-00 ${className}`}>
      {subBar}
      {divider ? (
        <div className="h-[0.5px] w-full bg-seed-gray-300" aria-hidden />
      ) : null}
    </header>
  );
}
