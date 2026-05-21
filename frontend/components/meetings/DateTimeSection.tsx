"use client";

import { useState } from "react";

import { useEventDraft } from "@/context/EventDraftContext";
import { TIME_OPTIONS } from "@/lib/constants/event-form";

import { SimpleCalendar } from "./SimpleCalendar";

export function DateTimeSection() {
  const { date, time, repeat, setDate, setTime, setRepeat } = useEventDraft();
  const [viewYear, setViewYear] = useState(date.getFullYear());
  const [viewMonth, setViewMonth] = useState(date.getMonth());

  const rowStyle = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding:
      "var(--seed-dimension-x3) var(--seed-dimension-spacing-x-global-gutter)",
    borderTop: "1px solid var(--seed-color-stroke-neutral-subtle)",
  } as const;

  const labelStyle = {
    fontSize: "var(--seed-font-size-t5)",
    color: "var(--seed-color-fg-neutral)",
  } as const;

  const selectStyle = {
    fontSize: "var(--seed-font-size-t5)",
    color: "var(--seed-color-fg-neutral)",
    border: "1px solid var(--seed-color-stroke-neutral-muted)",
    borderRadius: "var(--seed-radius-r2)",
    padding: "var(--seed-dimension-x2) var(--seed-dimension-x3)",
    background: "var(--seed-color-bg-layer-default)",
  } as const;

  return (
    <div>
      <SimpleCalendar
        year={viewYear}
        month={viewMonth}
        selectedDate={date}
        onSelect={setDate}
        onMonthChange={(y, m) => {
          setViewYear(y);
          setViewMonth(m);
        }}
      />
      <div style={rowStyle}>
        <span style={labelStyle}>시간</span>
        <select
          value={time}
          onChange={(e) => setTime(e.target.value)}
          style={selectStyle}
          aria-label="시간 선택"
        >
          {TIME_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>
      <div style={rowStyle}>
        <span style={labelStyle}>반복</span>
        <select
          value={repeat}
          onChange={(e) => setRepeat(e.target.value)}
          style={selectStyle}
          aria-label="반복 선택"
        >
          <option value="없음">없음</option>
          <option value="매주">매주</option>
          <option value="매월">매월</option>
        </select>
      </div>
    </div>
  );
}
