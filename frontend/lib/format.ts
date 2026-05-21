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
