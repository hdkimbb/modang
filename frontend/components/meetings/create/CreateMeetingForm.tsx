"use client";

import { ChevronDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { NavigationTop } from "@/components/common/NavigationTop";
import { BottomFixedButton } from "@/components/meetings/BottomFixedButton";
import { usePersona } from "@/context/PersonaContext";
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
  const { userId, isOwner, persona } = usePersona();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [showMoreCategories, setShowMoreCategories] = useState(false);
  const [neighborhood, setNeighborhood] = useState(DEFAULT_NEIGHBORHOOD);
  const [activityRange, setActivityRange] = useState(1);
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    !isOwner && name.trim().length > 0 && category !== null;

  const handleSubmit = async () => {
    if (isOwner) {
      alert("모임 만들기는 일반 멤버 계정에서만 할 수 있어요.");
      return;
    }
    if (!canSubmit || !category) return;
    setSubmitting(true);
    try {
      const created = await createMeeting({
        name: name.trim(),
        category,
        neighborhood,
        activity_range: activityRange,
        description: description.trim(),
        host_user_id: userId,
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
      {isOwner ? (
        <p className="mx-4 mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {persona.name}님은 사장 계정이에요. 모임을 만들려면 상단에서 일반 멤버로
          전환해 주세요.
        </p>
      ) : null}
      <NavigationTop
        variant="sub"
        title="모임 만들기"
        onBack={() => router.back()}
        divider
        className="sticky top-0 z-10 shrink-0"
      />

      <div className="flex-1 space-y-8 px-4 pb-6 pt-4">
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

      <BottomFixedButton
        label={submitting ? "만드는 중…" : "모임 만들기"}
        onClick={() => void handleSubmit()}
        disabled={!canSubmit}
        loading={submitting}
      />
    </div>
  );
}
