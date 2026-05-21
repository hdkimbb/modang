"use client";

import { Star, X } from "lucide-react";
import { useState } from "react";

import { createEventRating } from "@/lib/api";

const DEFAULT_USER_ID = "u_001";

type RatingModalProps = {
  open: boolean;
  onClose: () => void;
  eventId: string;
  placeName: string;
  meetingLabel: string;
  onSuccess: () => void;
};

export function RatingModal({
  open,
  onClose,
  eventId,
  placeName,
  meetingLabel,
  onSuccess,
}: RatingModalProps) {
  const [rating, setRating] = useState(0);
  const [wouldRevisit, setWouldRevisit] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (rating < 1 || wouldRevisit === null) return;
    setSubmitting(true);
    try {
      await createEventRating(eventId, {
        user_id: DEFAULT_USER_ID,
        rating,
        would_revisit: wouldRevisit,
      });
      setRating(0);
      setWouldRevisit(null);
      onSuccess();
      onClose();
      alert("평가가 등록됐어요");
    } catch (e) {
      alert(e instanceof Error ? e.message : "평가 등록에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">어떠셨어요?</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
            aria-label="닫기"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-2 text-sm font-medium text-gray-900">{placeName}</p>
        <p className="text-xs text-gray-500">{meetingLabel}</p>

        <p className="mt-4 text-sm font-medium text-gray-700">별점</p>
        <div className="mt-2 flex gap-1">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              className="p-1"
              aria-label={`${value}점`}
            >
              <Star
                className={`h-8 w-8 ${
                  value <= rating
                    ? "fill-orange-400 text-orange-400"
                    : "text-gray-300"
                }`}
                strokeWidth={1.5}
              />
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm font-medium text-gray-700">
          다시 올 의향이 있나요?
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => setWouldRevisit(true)}
            className={
              wouldRevisit === true
                ? "rounded-full bg-gray-900 px-4 py-2 text-sm text-white"
                : "rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700"
            }
          >
            네
          </button>
          <button
            type="button"
            onClick={() => setWouldRevisit(false)}
            className={
              wouldRevisit === false
                ? "rounded-full bg-gray-900 px-4 py-2 text-sm text-white"
                : "rounded-full border border-gray-300 px-4 py-2 text-sm text-gray-700"
            }
          >
            아니요
          </button>
        </div>

        <button
          type="button"
          disabled={rating < 1 || wouldRevisit === null || submitting}
          onClick={() => void handleSubmit()}
          className={`mt-6 w-full rounded-full py-3 text-sm font-medium text-white ${
            rating >= 1 && wouldRevisit !== null && !submitting
              ? "bg-orange-500"
              : "bg-gray-300"
          }`}
        >
          평가 등록
        </button>
      </div>
    </div>
  );
}
