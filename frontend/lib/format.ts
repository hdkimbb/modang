const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function formatEventDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

/** 24h "HH:mm" → display label (e.g. "오후 12:00") */
export function formatTimeFrom24h(hhmm: string): string {
  const [hourStr, minuteStr] = hhmm.split(":");
  const h24 = parseInt(hourStr, 10);
  const minute = (minuteStr ?? "00").padStart(2, "0");
  const period = h24 < 12 ? "오전" : "오후";
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return `${period} ${h12}:${minute}`;
}

export function formatEventDateTime(date: Date, time: string): string {
  const label = /^\d{1,2}:\d{2}$/.test(time)
    ? formatTimeFrom24h(time)
    : time;
  return `${formatEventDate(date)} ${label}`;
}

/** UI time (24h "HH:mm" or "오전/오후 H:mm") → ISO 8601 for API */
export function draftDateTimeToIso(date: Date, time: string): string {
  let hour: number;
  let minute: number;

  const h24 = time.match(/^(\d{1,2}):(\d{2})$/);
  if (h24) {
    hour = parseInt(h24[1], 10);
    minute = parseInt(h24[2], 10);
  } else {
    const match = time.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
    if (!match) {
      throw new Error(`Invalid time format: ${time}`);
    }
    const [, period, hourStr, minuteStr] = match;
    hour = parseInt(hourStr, 10);
    minute = parseInt(minuteStr, 10);
    if (period === "오후" && hour !== 12) hour += 12;
    if (period === "오전" && hour === 12) hour = 0;
  }

  const scheduled = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
    0,
    0,
  );
  return scheduled.toISOString();
}
