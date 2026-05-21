/** Owner dashboard meeting list filters (Asia/Seoul). */

export type OwnerMeetingFilter = "all" | "this_month" | "upcoming";

export type OwnerMeetingRow = {
  scheduled_at: string;
  is_upcoming: boolean;
};

const KST = "Asia/Seoul";

/** YYYY-MM in KST for month comparison. */
export function kstYearMonth(iso: string | Date): string {
  const d = typeof iso === "string" ? new Date(iso) : iso;
  const y = d.toLocaleString("en-CA", { timeZone: KST, year: "numeric" });
  const m = d.toLocaleString("en-CA", { timeZone: KST, month: "2-digit" });
  return `${y}-${m}`;
}

export function isThisMonthKst(
  scheduledAt: string,
  ref: Date = new Date(),
): boolean {
  return kstYearMonth(scheduledAt) === kstYearMonth(ref);
}

/** Future instant (UTC epoch compare; ISO from API is UTC-aware). */
export function isUpcomingSchedule(scheduledAt: string): boolean {
  return new Date(scheduledAt).getTime() > Date.now();
}

export function filterOwnerMeetings<T extends OwnerMeetingRow>(
  meetings: T[],
  filter: OwnerMeetingFilter,
): T[] {
  if (filter === "all") return meetings;
  if (filter === "this_month") {
    return meetings.filter((m) => isThisMonthKst(m.scheduled_at));
  }
  return meetings.filter(
    (m) => m.is_upcoming || isUpcomingSchedule(m.scheduled_at),
  );
}

export const OWNER_FILTER_EMPTY_MESSAGE: Record<
  Exclude<OwnerMeetingFilter, "all">,
  string
> = {
  this_month: "이번 달에 다녀간 모임이 없어요",
  upcoming: "예정된 모임이 없어요",
};
