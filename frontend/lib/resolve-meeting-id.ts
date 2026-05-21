/** Map legacy dev route id "1" to seeded meeting mtg_001. */
export function resolveApiMeetingId(routeId: string): string {
  return routeId === "1" ? "mtg_001" : routeId;
}
