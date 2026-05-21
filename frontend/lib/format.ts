const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"] as const;

export function formatEventDate(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = WEEKDAYS[date.getDay()];
  return `${month}월 ${day}일 (${weekday})`;
}

export function formatEventDateTime(date: Date, time: string): string {
  return `${formatEventDate(date)} ${time}`;
}

/** UI time label (e.g. "오후 12:00") → ISO 8601 for API */
export function draftDateTimeToIso(date: Date, time: string): string {
  const match = time.match(/^(오전|오후)\s*(\d{1,2}):(\d{2})$/);
  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }
  const [, period, hourStr, minuteStr] = match;
  let hour = parseInt(hourStr, 10);
  const minute = parseInt(minuteStr, 10);
  if (period === "오후" && hour !== 12) hour += 12;
  if (period === "오전" && hour === 12) hour = 0;

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
