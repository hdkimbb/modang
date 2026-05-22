"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PendingRatingCard } from "@/components/meetings/PendingRatingCard";
import { RatingModal } from "@/components/meetings/RatingModal";
import { usePersona } from "@/context/PersonaContext";
import { getPendingRatings } from "@/lib/api";
import {
  notifyRatingSubmitted,
  subscribeRatingSubmitted,
} from "@/lib/rating-sync";
import type { PendingRatingItemApi } from "@/lib/types/pending-rating";

const DISMISS_STORAGE_PREFIX = "modang:pendingRatingDismissed:";

function loadDismissed(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(`${DISMISS_STORAGE_PREFIX}${userId}`);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === "string"));
  } catch {
    return new Set();
  }
}

function saveDismissed(userId: string, ids: Set<string>) {
  localStorage.setItem(
    `${DISMISS_STORAGE_PREFIX}${userId}`,
    JSON.stringify([...ids]),
  );
}

export function PendingRatingsSection() {
  const { userId, ready } = usePersona();
  const [items, setItems] = useState<PendingRatingItemApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set());
  const [modalItem, setModalItem] = useState<PendingRatingItemApi | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getPendingRatings(userId);
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!ready) return;
    setDismissed(loadDismissed(userId));
    void load();
  }, [ready, userId, load]);

  useEffect(() => {
    return subscribeRatingSubmitted((eventId) => {
      setItems((prev) => prev.filter((item) => item.event_id !== eventId));
      setModalItem((current) =>
        current?.event_id === eventId ? null : current,
      );
    });
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => !dismissed.has(item.event_id)),
    [items, dismissed],
  );

  const handleDismiss = (eventId: string) => {
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(eventId);
      saveDismissed(userId, next);
      return next;
    });
  };

  const handleRated = (eventId: string) => {
    setItems((prev) => prev.filter((item) => item.event_id !== eventId));
    setModalItem(null);
    notifyRatingSubmitted(eventId);
  };

  if (loading || visibleItems.length === 0) {
    return null;
  }

  return (
    <section className="border-b border-seed-gray-200 bg-seed-gray-50 px-4 pb-4 pt-3">
      <h2 className="text-base font-bold text-seed-gray-900">
        평가 대기 중인 모임
      </h2>
      <p className="mt-0.5 text-xs text-seed-gray-600">
        다녀온 장소에 별점을 남겨보세요
      </p>

      <div className="mt-3 flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {visibleItems.map((item) => (
          <PendingRatingCard
            key={item.event_id}
            item={item}
            onRate={() => setModalItem(item)}
            onDismiss={() => handleDismiss(item.event_id)}
          />
        ))}
      </div>

      {modalItem ? (
        <RatingModal
          open
          eventId={modalItem.event_id}
          placeName={modalItem.place_name}
          meetingLabel={`${modalItem.meeting_title} · ${modalItem.event_title}`}
          onClose={() => setModalItem(null)}
          onSuccess={() => handleRated(modalItem.event_id)}
        />
      ) : null}
    </section>
  );
}
