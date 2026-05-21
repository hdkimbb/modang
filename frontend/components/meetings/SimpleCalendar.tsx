"use client";

interface SimpleCalendarProps {
  year: number;
  month: number;
  selectedDate: Date;
  onSelect: (date: Date) => void;
  onMonthChange: (year: number, month: number) => void;
}

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function SimpleCalendar({
  year,
  month,
  selectedDate,
  onSelect,
  onMonthChange,
}: SimpleCalendarProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const totalDays = daysInMonth(year, month);
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  const goMonth = (delta: number) => {
    const d = new Date(year, month + delta, 1);
    onMonthChange(d.getFullYear(), d.getMonth());
  };

  const isSelected = (day: number) =>
    selectedDate.getFullYear() === year &&
    selectedDate.getMonth() === month &&
    selectedDate.getDate() === day;

  return (
    <div
      style={{
        padding:
          "0 var(--seed-dimension-spacing-x-global-gutter) var(--seed-dimension-x4)",
      }}
    >
      <div
        className="mb-3 flex items-center justify-between"
        style={{
          fontSize: "var(--seed-font-size-t5)",
          fontWeight: "var(--seed-font-weight-bold)",
        }}
      >
        <button
          type="button"
          onClick={() => goMonth(-1)}
          aria-label="이전 달"
          className="border-none bg-transparent"
          style={{
            color: "var(--seed-color-fg-neutral)",
            cursor: "pointer",
            padding: "var(--seed-dimension-x2)",
          }}
        >
          ‹
        </button>
        <span>
          {year}년 {String(month + 1).padStart(2, "0")}월
        </span>
        <button
          type="button"
          onClick={() => goMonth(1)}
          aria-label="다음 달"
          className="border-none bg-transparent"
          style={{
            color: "var(--seed-color-fg-neutral)",
            cursor: "pointer",
            padding: "var(--seed-dimension-x2)",
          }}
        >
          ›
        </button>
      </div>
      <div className="mb-2 grid grid-cols-7 text-center">
        {WEEKDAY_LABELS.map((label) => (
          <span
            key={label}
            style={{
              fontSize: "var(--seed-font-size-t3)",
              color: "var(--seed-color-fg-neutral-subtle)",
              padding: "var(--seed-dimension-x1) 0",
            }}
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center">
        {cells.map((day, index) =>
          day === null ? (
            <span key={`empty-${index}`} />
          ) : (
            <button
              key={day}
              type="button"
              onClick={() => onSelect(new Date(year, month, day))}
              className="mx-auto flex items-center justify-center border-none"
              style={{
                width: "var(--seed-dimension-x9)",
                height: "var(--seed-dimension-x9)",
                borderRadius: "var(--seed-radius-full)",
                fontSize: "var(--seed-font-size-t4)",
                fontWeight: isSelected(day)
                  ? "var(--seed-font-weight-bold)"
                  : "var(--seed-font-weight-regular)",
                background: isSelected(day)
                  ? "var(--seed-color-bg-neutral-inverted)"
                  : "transparent",
                color: isSelected(day)
                  ? "var(--seed-color-fg-neutral-inverted)"
                  : "var(--seed-color-fg-neutral)",
                cursor: "pointer",
              }}
            >
              {day}
            </button>
          ),
        )}
      </div>
    </div>
  );
}
