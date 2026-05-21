"use client";

import { Bell, Clock, Lightbulb, Target } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const DEFAULT_OWNER_ID = "usr_owner_001";
const MESSAGE_MAX = 100;
const RECOMMENDATION_CHIP_CATEGORIES = [
  "독서",
  "스터디",
  "운동",
  "자기계발",
  "취미",
  "음식",
] as const;

type OwnerDashboard = {
  place: { id: string; name: string; address: string };
  stats: {
    total_visits: number;
    this_month_visits: number;
    upcoming_count: number;
  };
  meetings: {
    meeting_id: string;
    name: string;
    category: string;
    member_count: number;
    scheduled_at: string;
    is_upcoming: boolean;
    place_signal_count: number;
  }[];
};

type OwnerMessage = { message: string; active: boolean };

type RecommendedAction = {
  type: string;
  label: string;
  template: string;
};

type CategoryInsight = {
  category: string;
  count: number;
  percentage: number;
  avg_member_count: number;
  recommended_action: RecommendedAction;
};

type OwnerInsights = {
  total_meetings: number;
  top_categories: CategoryInsight[];
};

type TimeslotInsight = {
  key: string;
  label: string;
  count: number;
  percentage: number;
};

type OwnerTimeslotInsights = {
  total_events: number;
  slots: TimeslotInsight[];
  peak_slot: string | null;
  low_slot: string | null;
  peak_recommendation: string;
};

function formatVisitDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${day} ${h}:${min}`;
}

async function parseApiError(res: Response, fallback: string): Promise<string> {
  const err = await res.json().catch(() => ({}));
  return err.detail?.error?.message ?? fallback;
}

function OwnerDashboardContent() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user_id") ?? DEFAULT_OWNER_ID;
  const messageCardRef = useRef<HTMLElement>(null);

  const [data, setData] = useState<OwnerDashboard | null>(null);
  const [ownerMessage, setOwnerMessage] = useState<OwnerMessage>({
    message: "",
    active: false,
  });
  const [insights, setInsights] = useState<OwnerInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draftMessage, setDraftMessage] = useState("");
  const [savingMessage, setSavingMessage] = useState(false);
  const [timeslots, setTimeslots] = useState<OwnerTimeslotInsights | null>(null);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [savedCategories, setSavedCategories] = useState<string[]>([]);
  const [savingTargets, setSavingTargets] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ user_id: userId });
    try {
      const [dashRes, msgRes, insRes, slotRes, targetRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/owner/dashboard?${params}`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/api/v1/owner/message?${params}`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/api/v1/owner/insights/categories?${params}`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/api/v1/owner/insights/timeslots?${params}`, {
          cache: "no-store",
        }),
        fetch(`${API_BASE}/api/v1/owner/recommendation-targets?${params}`, {
          cache: "no-store",
        }),
      ]);

      if (!dashRes.ok) {
        throw new Error(await parseApiError(dashRes, "대시보드를 불러오지 못했어요."));
      }
      if (!msgRes.ok) {
        throw new Error(await parseApiError(msgRes, "메시지를 불러오지 못했어요."));
      }
      if (!insRes.ok) {
        throw new Error(await parseApiError(insRes, "인사이트를 불러오지 못했어요."));
      }
      if (!slotRes.ok) {
        throw new Error(await parseApiError(slotRes, "시간대 인사이트를 불러오지 못했어요."));
      }
      if (!targetRes.ok) {
        throw new Error(await parseApiError(targetRes, "추천 노출 설정을 불러오지 못했어요."));
      }

      const [dashJson, msgJson, insJson, slotJson, targetJson] = await Promise.all([
        dashRes.json() as Promise<OwnerDashboard>,
        msgRes.json() as Promise<OwnerMessage>,
        insRes.json() as Promise<OwnerInsights>,
        slotRes.json() as Promise<OwnerTimeslotInsights>,
        targetRes.json() as Promise<{ categories: string[] }>,
      ]);

      setData(dashJson);
      setOwnerMessage(msgJson);
      setDraftMessage(msgJson.message);
      setInsights(insJson);
      setTimeslots(slotJson);
      setSelectedCategories(targetJson.categories);
      setSavedCategories(targetJson.categories);
    } catch (e) {
      alert(e instanceof Error ? e.message : "데이터를 불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const patchMessage = useCallback(
    async (message: string, active: boolean) => {
      const params = new URLSearchParams({ user_id: userId });
      const res = await fetch(`${API_BASE}/api/v1/owner/message?${params}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, active }),
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(await parseApiError(res, "저장에 실패했어요."));
      }
      return (await res.json()) as OwnerMessage;
    },
    [userId],
  );

  const handleToggleActive = async () => {
    const nextActive = !ownerMessage.active;
    const prev = { ...ownerMessage };
    setOwnerMessage({ message: prev.message, active: nextActive });
    try {
      const updated = await patchMessage(prev.message, nextActive);
      setOwnerMessage(updated);
      setDraftMessage(updated.message);
    } catch (e) {
      setOwnerMessage(prev);
      alert(e instanceof Error ? e.message : "변경에 실패했어요.");
    }
  };

  const handleSaveMessage = async () => {
    const trimmed = draftMessage.trim();
    if (trimmed.length > MESSAGE_MAX) {
      alert("메시지는 100자 이내로 작성해 주세요.");
      return;
    }
    const prev = { ...ownerMessage };
    const next = { message: trimmed, active: prev.active };
    setOwnerMessage(next);
    setEditing(false);
    setSavingMessage(true);
    try {
      const updated = await patchMessage(trimmed, next.active);
      setOwnerMessage(updated);
      setDraftMessage(updated.message);
    } catch (e) {
      setOwnerMessage(prev);
      setDraftMessage(prev.message);
      setEditing(true);
      alert(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setSavingMessage(false);
    }
  };

  const handleApplyTemplate = (template: string) => {
    setDraftMessage(template.slice(0, MESSAGE_MAX));
    setEditing(true);
    messageCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const categoriesDirty =
    JSON.stringify([...selectedCategories].sort()) !==
    JSON.stringify([...savedCategories].sort());

  const toggleRecommendationCategory = (category: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(category)) {
        return prev.filter((c) => c !== category);
      }
      if (prev.length >= 3) {
        alert("최대 3개까지 선택할 수 있어요");
        return prev;
      }
      return [...prev, category];
    });
  };

  const handleSaveRecommendationTargets = async () => {
    const params = new URLSearchParams({ user_id: userId });
    const prev = [...savedCategories];
    setSavedCategories(selectedCategories);
    setSavingTargets(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/v1/owner/recommendation-targets?${params}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categories: selectedCategories }),
          cache: "no-store",
        },
      );
      if (!res.ok) {
        throw new Error(await parseApiError(res, "저장에 실패했어요."));
      }
      const updated = (await res.json()) as { categories: string[] };
      setSelectedCategories(updated.categories);
      setSavedCategories(updated.categories);
      alert("저장됐어요");
    } catch (e) {
      setSavedCategories(prev);
      setSelectedCategories(prev);
      alert(e instanceof Error ? e.message : "저장에 실패했어요.");
    } finally {
      setSavingTargets(false);
    }
  };

  if (loading) {
    return (
      <p className="px-4 py-24 text-center text-sm text-gray-500">
        불러오는 중...
      </p>
    );
  }

  if (!data) {
    return (
      <p className="px-4 py-24 text-center text-sm text-gray-400">
        데이터를 표시할 수 없어요.
      </p>
    );
  }

  const displayMessage = ownerMessage.message.trim();
  const charCount = editing ? draftMessage.length : displayMessage.length;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="border-b border-gray-100 px-4 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold">{data.place.name}</h1>
            <p className="mt-0.5 text-sm text-gray-500">{data.place.address}</p>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-full p-2 text-gray-600 hover:bg-gray-50"
            aria-label="알림"
          >
            <Bell className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
      </header>

      <section
        ref={messageCardRef}
        className="mx-4 mt-4 rounded-2xl border border-gray-200 bg-white p-4"
      >
        <h2 className="text-base font-bold">사장님 제안 메시지</h2>
        <p className="mt-1 text-xs text-gray-500">
          사용자가 우리 가게 페이지에서 보는 메시지를 작성해보세요
        </p>

        {editing ? (
          <div className="mt-3">
            <textarea
              value={draftMessage}
              onChange={(e) =>
                setDraftMessage(e.target.value.slice(0, MESSAGE_MAX))
              }
              rows={4}
              maxLength={MESSAGE_MAX}
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-orange-300"
              placeholder="모임 손님에게 전할 메시지를 입력해 주세요"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {draftMessage.length}/{MESSAGE_MAX}자
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                disabled={savingMessage}
                onClick={() => void handleSaveMessage()}
                className="flex-1 rounded-full bg-orange-500 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                저장
              </button>
              <button
                type="button"
                disabled={savingMessage}
                onClick={() => {
                  setDraftMessage(ownerMessage.message);
                  setEditing(false);
                }}
                className="flex-1 rounded-full border border-gray-200 py-2 text-sm text-gray-600"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3 rounded-xl bg-gray-50 p-3">
            {displayMessage ? (
              <p className="line-clamp-3 whitespace-pre-wrap text-sm text-gray-800">
                &quot;{displayMessage}&quot;
              </p>
            ) : (
              <p className="text-sm text-gray-400">메시지를 작성해 주세요</p>
            )}
          </div>
        )}

        {!editing ? (
          <p className="mt-2 text-right text-xs text-gray-400">
            {charCount}/{MESSAGE_MAX}자
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                ownerMessage.active ? "bg-green-500" : "bg-gray-400"
              }`}
              aria-hidden
            />
            <span className="text-gray-600">
              {ownerMessage.active ? "노출 중" : "노출 중지"}
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleToggleActive()}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600"
            >
              {ownerMessage.active ? "노출 끄기" : "노출 켜기"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDraftMessage(ownerMessage.message);
                setEditing(true);
              }}
              className="rounded-full border border-gray-200 px-3 py-1.5 text-xs text-gray-600"
            >
              수정
            </button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 p-4">
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
          <p className="text-xs text-gray-600">전체 방문</p>
          <p className="mt-1 text-3xl font-bold">{data.stats.total_visits}</p>
          <p className="text-xs text-gray-500">모임</p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
          <p className="text-xs text-gray-600">이번 달</p>
          <p className="mt-1 text-3xl font-bold">{data.stats.this_month_visits}</p>
          <p className="text-xs text-gray-500">모임</p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4">
          <p className="text-xs text-gray-600">예정</p>
          <p className="mt-1 text-3xl font-bold">{data.stats.upcoming_count}</p>
          <p className="text-xs text-gray-500">모임</p>
        </div>
      </section>

      <section className="mx-4 mb-4 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-orange-500" strokeWidth={1.75} />
          <h2 className="text-base font-bold">우리 가게에 자주 오는 모임</h2>
        </div>

        {!insights || insights.total_meetings === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            아직 다녀간 모임이 없어 인사이트를 만들 수 없어요
          </p>
        ) : (
          <ul className="mt-4 space-y-4">
            {insights.top_categories.map((item, index) => (
              <li key={item.category}>
                <p className="text-sm font-bold text-gray-900">
                  {index + 1}위 {item.category} ({item.count}팀, {item.percentage}
                  %)
                </p>
                <div className="mt-2 rounded-xl bg-gray-50 p-3">
                  <p className="text-sm text-gray-600">
                    평균 {item.avg_member_count}명
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      handleApplyTemplate(item.recommended_action.template)
                    }
                    className="mt-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-2 text-xs font-medium text-orange-600"
                  >
                    {item.recommended_action.label}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-4 mb-4 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-orange-500" strokeWidth={1.75} />
          <h2 className="text-base font-bold">모임이 가장 많이 오는 시간</h2>
        </div>

        {!timeslots || timeslots.total_events === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            아직 다녀간 모임이 없어 시간대 분석을 할 수 없어요
          </p>
        ) : (
          <>
            <ul className="mt-4 space-y-3">
              {timeslots.slots.map((slot) => {
                const isPeak = slot.key === timeslots.peak_slot;
                const isLow = slot.key === timeslots.low_slot && slot.count > 0;
                const isEmpty = slot.count === 0;
                return (
                  <li key={slot.key}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span
                        className={
                          isPeak
                            ? "font-bold text-orange-600"
                            : isLow || isEmpty
                              ? "text-gray-400"
                              : "text-gray-800"
                        }
                      >
                        {slot.label}
                        {isLow && slot.count > 0 ? " (비수기)" : ""}
                      </span>
                      <span
                        className={
                          isPeak
                            ? "font-bold text-orange-600"
                            : "text-gray-500"
                        }
                      >
                        {slot.percentage}%
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-gray-100">
                      <div
                        className={`h-2 rounded-full ${
                          isPeak
                            ? "bg-orange-500"
                            : isLow || isEmpty
                              ? "bg-gray-300"
                              : "bg-orange-400"
                        }`}
                        style={{
                          width: `${Math.max(slot.percentage, slot.count > 0 ? 4 : 0)}%`,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            {timeslots.peak_recommendation ? (
              <div className="mt-4 rounded-xl bg-gray-50 p-3 text-sm text-gray-700">
                <p className="font-medium text-gray-900">추천 액션</p>
                <p className="mt-1">{timeslots.peak_recommendation}</p>
              </div>
            ) : null}
          </>
        )}
      </section>

      <section className="mx-4 mb-4 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-orange-500" strokeWidth={1.75} />
          <h2 className="text-base font-bold">우리 가게에 잘 맞는 모임 추천 노출</h2>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          어떤 카테고리 모임에 노출하시겠어요?
        </p>
        <p className="text-xs text-gray-500">최대 3개까지 선택할 수 있어요.</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {RECOMMENDATION_CHIP_CATEGORIES.map((category) => {
            const selected = selectedCategories.includes(category);
            const disabled = !selected && selectedCategories.length >= 3;
            return (
              <button
                key={category}
                type="button"
                disabled={disabled}
                onClick={() => toggleRecommendationCategory(category)}
                className={
                  selected
                    ? "rounded-full bg-gray-900 px-4 py-2 text-sm text-white"
                    : disabled
                      ? "cursor-not-allowed rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700 opacity-50"
                      : "rounded-full border border-gray-300 bg-white px-4 py-2 text-sm text-gray-700"
                }
              >
                {category}
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-gray-500">
          선택한 카테고리의 모임이 장소 검색 시 &quot;사장님 추천&quot; 뱃지로
          상단 노출돼요
        </p>

        <button
          type="button"
          disabled={!categoriesDirty || savingTargets}
          onClick={() => void handleSaveRecommendationTargets()}
          className={`mt-4 w-full rounded-full py-3 text-sm font-medium text-white ${
            categoriesDirty && !savingTargets
              ? "bg-orange-500"
              : "bg-gray-300"
          }`}
        >
          저장하기
        </button>
      </section>

      <section className="min-h-0 flex-1">
        <h2 className="px-4 text-lg font-bold">다녀간 모임</h2>
        {data.meetings.length === 0 ? (
          <p className="py-12 text-center text-gray-400">
            아직 다녀간 모임이 없어요
          </p>
        ) : (
          <ul>
            {data.meetings.map((m) => (
              <li
                key={`${m.meeting_id}-${m.scheduled_at}`}
                className="flex items-center justify-between border-b border-gray-100 p-4"
              >
                <div className="min-w-0 flex-1 pr-3">
                  <p className="text-base font-bold">{m.name}</p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {m.category} · {m.member_count}명
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {formatVisitDate(m.scheduled_at)}
                  </p>
                </div>
                <span
                  className={
                    m.is_upcoming
                      ? "shrink-0 rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-600"
                      : "shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600"
                  }
                >
                  {m.is_upcoming ? "예정" : "다녀감"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function OwnerPage() {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-24 text-center text-sm text-gray-500">
          불러오는 중...
        </p>
      }
    >
      <OwnerDashboardContent />
    </Suspense>
  );
}
