/** Cross-screen refresh after a meeting event rating is submitted. */

export const RATING_SUBMITTED_EVENT = "modang:rating-submitted";

export type RatingSubmittedDetail = {
  eventId: string;
};

export function notifyRatingSubmitted(eventId: string): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<RatingSubmittedDetail>(RATING_SUBMITTED_EVENT, {
      detail: { eventId },
    }),
  );
}

export function subscribeRatingSubmitted(
  handler: (eventId: string) => void,
): () => void {
  if (typeof window === "undefined") return () => undefined;

  const listener = (event: Event) => {
    const detail = (event as CustomEvent<RatingSubmittedDetail>).detail;
    if (detail?.eventId) handler(detail.eventId);
  };
  window.addEventListener(RATING_SUBMITTED_EVENT, listener);
  return () => window.removeEventListener(RATING_SUBMITTED_EVENT, listener);
}
