"use client";

export interface TabItem {
  key: string;
  label: string;
  badge?: boolean;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  variant?: "responsive" | "fixed";
  className?: string;
}

export function Tabs({
  items,
  activeKey,
  onChange,
  variant = "responsive",
  className = "",
}: TabsProps) {
  return (
    <div
      className={`relative h-10 w-full shrink-0 bg-seed-gray-00 ${className}`}
      role="tablist"
    >
      <div
        className={`flex h-10 items-stretch ${
          variant === "fixed" ? "justify-start px-4" : ""
        }`}
      >
        {items.map((item) => {
          const active = activeKey === item.key;
          const disabled = item.disabled === true;
          return (
            <button
              key={item.key}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => {
                if (!disabled) onChange(item.key);
              }}
              className={`relative flex flex-col items-center justify-center ${
                variant === "responsive" ? "min-w-0 flex-1" : "shrink-0 px-3.5"
              }`}
            >
              <span
                className={`flex items-center gap-0.5 px-2.5 py-[9.5px] text-sm font-bold leading-[1.35] ${
                  disabled
                    ? "text-seed-gray-400"
                    : active
                      ? "text-seed-gray-900"
                      : "text-seed-gray-600"
                }`}
              >
                {item.label}
                {item.badge ? (
                  <span
                    className="h-1 w-1 shrink-0 rounded-full bg-seed-carrot-500"
                    aria-label="새 알림"
                  />
                ) : null}
              </span>
              {active && !disabled ? (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-seed-carrot-500"
                  aria-hidden
                />
              ) : null}
            </button>
          );
        })}
      </div>
      <div
        className="pointer-events-none absolute bottom-0 left-0 right-0 h-[0.5px] bg-seed-gray-300"
        aria-hidden
      />
    </div>
  );
}
