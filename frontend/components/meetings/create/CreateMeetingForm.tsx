"use client";

import { ChevronDown, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createMeeting } from "@/lib/api";
import {
  DEFAULT_NEIGHBORHOOD,
  MORE_CATEGORIES,
  NEIGHBORHOODS,
  PRIMARY_CATEGORIES,
} from "@/lib/constants/meeting-create";

function Chip({
  label,
  selected,
  onClick,
  icon,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-5 py-2 text-sm transition-colors ${
        selected
          ? "bg-gray-900 text-white"
          : "border border-gray-300 bg-white text-gray-700"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function CreateMeetingForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [neighborhood, setNeighborhood] = useState(DEFAULT_NEIGHBORHOOD);
  const [activityRange, setActivityRange] = useState(1);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = name.trim().length > 0 && category !== null;

  const handleSubmit = async () => {
    if (!canSubmit || !category) return;
    setSubmitting(true);
    try {
      const created = await createMeeting({
        name: name.trim(),
        category,
        neighborhood,
        activity_range: activityRange,
        description: description.trim(),
      });
      alert("모임이 만들어졌어요!");
      router.push("/meetings");
      void created;
    } catch (err) {
      alert(err instanceof Error ? err.message : "모임 만들기에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-white pb-24">
      <div className="shrink-0 px-4 pt-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex p-1 text-gray-900"
          aria-label="닫기"
        >
          <X size={24} strokeWidth={2} />
        </button>
      </div>

      <div className="flex-1 space-y-8 px-4 pb-6 pt-2">
        <h1 className="text-2xl font-bold text-gray-900">
          어떤 모임을 만들까요?
        </h1>

        <section className="space-y-2">
          <label className="text-base font-bold text-gray-900" htmlFor="name">
            모임명
          </label>
          <input
            id="name"
            type="text"
            maxLength={24}
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 24))}
            placeholder="모임명이 짧을수록 이해하기 쉬워요."
            className="w-full rounded-xl border border-gray-300 p-4 text-gray-900 outline-none focus:border-gray-900"
          />
          <p className="text-right text-sm text-gray-400">{name.length}/24</p>
        </section>

        <section className="space-y-3">
          <p className="text-base font-bold text-gray-900">카테고리</p>
          <div className="flex flex-wrap gap-2">
            {PRIMARY_CATEGORIES.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={category === item}
                onClick={() => setCategory(item)}
              />
            ))}
            <button
              type="button"
              onClick={() => setShowMoreCategories((v) => !v)}
              className={`inline-flex shrink-0 items-center gap-0.5 rounded-full px-5 py-2 text-sm transition-colors ${
                showMoreCategories
                  ? "bg-gray-900 text-white"
                  : "border border-gray-300 bg-white text-gray-700"
              }`}
            >
              더보기
              <ChevronDown
                size={16}
                className={showMoreCategories ? "rotate-180" : ""}
              />
            </button>
          </div>
          {showMoreCategories ? (
            <div className="flex flex-wrap gap-2">
              {MORE_CATEGORIES.map((item) => (
                <Chip
                  key={item}
                  label={item}
                  selected={category === item}
                  onClick={() => setCategory(item)}
                />
              ))}
            </div>
          ) : null}
        </section>

        <section className="space-y-3">
          <p className="text-base font-bold text-gray-900">활동 지역</p>
          <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-1">
            <Chip
              label="검색"
              selected={false}
              onClick={() => {}}
              icon={<Search size={16} className="text-gray-500" />}
            />
            {NEIGHBORHOODS.map((item) => (
              <Chip
                key={item}
                label={item}
                selected={neighborhood === item}
                onClick={() => setNeighborhood(item)}
              />
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <p className="text-base font-bold text-gray-900">활동 범위</p>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={activityRange}
            onChange={(e) => setActivityRange(Number(e.target.value))}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-gray-200 accent-gray-900"
            aria-label="활동 범위"
          />
          <div className="flex justify-between text-sm text-gray-500">
            <span>가까운 동네</span>
            <span>먼 동네</span>
          </div>
          <div className="flex h-48 items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400">
            지도 미리보기
          </div>
        </section>

        <section className="space-y-2">
          <label
            className="text-base font-bold text-gray-900"
            htmlFor="description"
          >
            모임 소개
          </label>
          <textarea
            id="description"
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="활동 중심으로 모임을 소개해주세요. 소개를 잘 작성한 모임은 2배 많은 이웃이 가입해요."
            className="min-h-[200px] w-full resize-none rounded-xl border border-gray-300 p-4 text-gray-900 outline-none focus:border-gray-900"
          />
          <p className="text-right text-sm text-gray-400">
            {description.length}/500
          </p>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 mx-auto max-w-md">
        <button
          type="button"
          disabled={!canSubmit || submitting}
          onClick={() => void handleSubmit()}
          className={`w-full py-4 text-base font-bold text-white transition-colors ${
            canSubmit && !submitting
              ? "bg-orange-500 hover:bg-orange-600"
              : "cursor-not-allowed bg-gray-300"
          }`}
        >
          {submitting ? "만드는 중…" : "모임 만들기"}
        </button>
      </div>
    </div>
  );
}
