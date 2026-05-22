"use client";

import { Bell } from "lucide-react";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { NavigationTop } from "@/components/common/NavigationTop";
import { Tabs } from "@/components/common/Tabs";
import { PersonaHeaderMenu } from "@/components/dev/PersonaHeaderMenu";
import { HomeTab } from "@/components/owner/HomeTab";
import { InsightsTab } from "@/components/owner/InsightsTab";
import { ToolsTab } from "@/components/owner/ToolsTab";
import { usePersona } from "@/context/PersonaContext";
import { filterOwnerMeetings, type OwnerMeetingFilter } from "@/lib/owner-meeting-filter";
import { API_BASE } from "@/lib/api";
import type {
  OwnerDashboard,
  OwnerInsights,
  OwnerMessage,
  OwnerTabId,
  OwnerTimeslotInsights,
} from "@/lib/types/owner";

async function parseApiError(res: Response, fallback: string): Promise<string> {
  const err = await res.json().catch(() => ({}));
  return err.detail?.error?.message ?? fallback;
}

const OWNER_TABS = [
  { key: "home" as const, label: "홈" },
  { key: "insights" as const, label: "인사이트" },
  { key: "tools" as const, label: "도구" },
];

function OwnerDashboardContent() {
  const { persona, userId, isOwner } = usePersona();

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
  const [meetingFilter, setMeetingFilter] = useState<OwnerMeetingFilter>("all");
  const [activeTab, setActiveTab] = useState<OwnerTabId>("home");
  const [pendingMessageTemplate, setPendingMessageTemplate] = useState<
    string | null
  >(null);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);

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
    if (trimmed.length > 100) {
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

  const handleApplyMessageTemplate = (template: string) => {
    setPendingMessageTemplate(template);
    setActiveTab("tools");
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

  const filteredMeetings = useMemo(() => {
    if (!data) return [];
    return filterOwnerMeetings(data.meetings, meetingFilter);
  }, [data, meetingFilter]);

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

  if (!isOwner) {
    return (
      <p className="px-4 py-24 text-center text-sm text-gray-600">
        사장 대시보드는 상단에서 <strong>김사장</strong> 계정으로 전환한 뒤
        이용할 수 있어요.
        <br />
        <span className="mt-2 block text-gray-400">
          현재: {persona.name} ({persona.region})
        </span>
      </p>
    );
  }

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

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="relative shrink-0">
        <NavigationTop
          variant="main"
          title={`${persona.name} 대시보드`}
          showExpandMore
          titleExpanded={personaMenuOpen}
          onTitleClick={() => setPersonaMenuOpen((v) => !v)}
          divider
          rightItems={[
            <button
              key="bell"
              type="button"
              className="text-seed-gray-900"
              aria-label="알림"
              onClick={() => alert("알림은 준비 중이에요")}
            >
              <Bell size={24} strokeWidth={2} />
            </button>,
          ]}
        />
        <PersonaHeaderMenu
          open={personaMenuOpen}
          onOpenChange={setPersonaMenuOpen}
        />
      </div>
      <div className="shrink-0 px-4 pb-4">
        <p className="text-sm font-medium text-seed-gray-900">{data.place.name}</p>
        <p className="mt-0.5 text-xs text-seed-gray-500">{data.place.address}</p>
      </div>

      <Tabs
        items={OWNER_TABS}
        activeKey={activeTab}
        onChange={(key) => setActiveTab(key as OwnerTabId)}
      />

      {activeTab === "home" ? (
        <HomeTab
          data={data}
          meetingFilter={meetingFilter}
          onMeetingFilterChange={setMeetingFilter}
          filteredMeetings={filteredMeetings}
        />
      ) : null}

      {activeTab === "insights" ? (
        <InsightsTab
          insights={insights}
          timeslots={timeslots}
          mentionStats={data.mention_stats}
          onApplyMessageTemplate={handleApplyMessageTemplate}
        />
      ) : null}

      {activeTab === "tools" ? (
        <ToolsTab
          ownerMessage={ownerMessage}
          editing={editing}
          draftMessage={draftMessage}
          savingMessage={savingMessage}
          selectedCategories={selectedCategories}
          categoriesDirty={categoriesDirty}
          savingTargets={savingTargets}
          pendingMessageTemplate={pendingMessageTemplate}
          onDraftMessageChange={setDraftMessage}
          onEditingChange={setEditing}
          onToggleActive={() => void handleToggleActive()}
          onSaveMessage={() => void handleSaveMessage()}
          onToggleRecommendationCategory={toggleRecommendationCategory}
          onSaveRecommendationTargets={() => void handleSaveRecommendationTargets()}
          onPendingTemplateConsumed={() => setPendingMessageTemplate(null)}
        />
      ) : null}
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
