"use client";

import {
  Calendar,
  ChevronRight,
  Flame,
  Hash,
  Menu,
  MessageCircle,
  Pencil,
  Search,
  Users,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { NavigationTop } from "@/components/common/NavigationTop";
import { Tabs } from "@/components/common/Tabs";
import { PostActionSheet } from "@/components/meetings/PostActionSheet";
import {
  getMeetingDetail,
  getMeetingEvents,
  getMeetingPlaceHistory,
  getMeetingPosts,
} from "@/lib/api";
import { resolveApiMeetingId } from "@/lib/resolve-meeting-id";
import { DEFAULT_MEETING_THUMBNAIL } from "@/lib/types/meeting-list";
import type {
  MeetingDetailApi,
  MeetingEventSummaryApi,
  PlaceHistoryItemApi,
} from "@/lib/types/meeting-detail";
import type { MeetingPostItemApi } from "@/lib/types/meeting-post";

import { MeetingEventCard } from "./MeetingEventCard";
import { MeetingPlaceHistoryCard } from "./MeetingPlaceHistoryCard";
import { MeetingPostCard } from "./MeetingPostCard";

type BoardFilter = "all" | "free";
type DetailTab = "schedule" | "place_history";

interface MeetingDetailScreenProps {
  routeMeetingId: string;
}

const ACTION_ITEMS = [
  { id: "schedule", label: "일정", icon: Calendar, href: "events/new" },
  { id: "challenge", label: "챌린지", icon: Flame, alert: "준비 중" },
  { id: "chat", label: "채팅", icon: MessageCircle, alert: "준비 중" },
  { id: "members", label: "멤버", icon: Users, alert: "준비 중" },
] as const;

const DETAIL_TABS = [
  { key: "schedule" as const, label: "일정" },
  { key: "place_history" as const, label: "장소 이력" },
];

export function MeetingDetailScreen({ routeMeetingId }: MeetingDetailScreenProps) {
  const router = useRouter();
  const apiMeetingId = resolveApiMeetingId(routeMeetingId);

  const [detail, setDetail] = useState<MeetingDetailApi | null>(null);
  const [posts, setPosts] = useState<MeetingPostItemApi[]>([]);
  const [total, setTotal] = useState(0);
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
  const [detailTab, setDetailTab] = useState<DetailTab>("schedule");
  const [allEvents, setAllEvents] = useState<MeetingEventSummaryApi[]>([]);
  const [placeHistory, setPlaceHistory] = useState<PlaceHistoryItemApi[]>([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detailData, postsData] = await Promise.all([
        getMeetingDetail(apiMeetingId),
        getMeetingPosts(apiMeetingId, {
          board_type: boardFilter === "free" ? "free" : undefined,
        }),
      ]);
      setDetail(detailData);
      setPosts(postsData.items);
      setTotal(postsData.total);
    } catch {
      alert("모임 정보를 불러오지 못했어요");
    } finally {
      setLoading(false);
    }
  }, [apiMeetingId, boardFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!detail) return;
    setTabLoading(true);
    const loadTab = async () => {
      try {
        if (detailTab === "schedule") {
          const { items } = await getMeetingEvents(apiMeetingId);
          setAllEvents(items);
        } else {
          const { items } = await getMeetingPlaceHistory(apiMeetingId);
          setPlaceHistory(items);
        }
      } catch {
        if (detailTab === "schedule") {
          setAllEvents([]);
        } else {
          setPlaceHistory([]);
        }
      } finally {
        setTabLoading(false);
      }
    };
    void loadTab();
  }, [apiMeetingId, detail, detailTab]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = Date.now();
    const upcoming: MeetingEventSummaryApi[] = [];
    const past: MeetingEventSummaryApi[] = [];
    for (const ev of allEvents) {
      if (ev.status === "ended" || new Date(ev.scheduled_at).getTime() < now) {
        past.push(ev);
      } else {
        upcoming.push(ev);
      }
    }
    past.sort(
      (a, b) =>
        new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
    );
    upcoming.sort(
      (a, b) =>
        new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    );
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [allEvents]);

  if (loading) {
    return (
      <p className="px-4 py-24 text-center text-sm text-seed-gray-500">
        불러오는 중...
      </p>
    );
  }

  if (!detail) {
    return (
      <p className="px-4 py-24 text-center text-sm text-seed-gray-400">
        모임을 표시할 수 없어요
      </p>
    );
  }

  const headerRight = [
    <button key="chat" type="button" aria-label="채팅" className="text-seed-gray-900">
      <MessageCircle size={24} strokeWidth={2} />
    </button>,
    <button key="search" type="button" aria-label="검색" className="text-seed-gray-900">
      <Search size={24} strokeWidth={2} />
    </button>,
    <button key="menu" type="button" aria-label="메뉴" className="text-seed-gray-900">
      <Menu size={24} strokeWidth={2} />
    </button>,
  ];

  return (
    <div className="relative min-h-dvh w-full bg-white pb-28">
      <NavigationTop
        variant="sub"
        title={detail.name}
        onBack={() => router.back()}
        rightItems={headerRight}
        divider
        className="sticky top-0 z-10"
      />

      <section className="flex items-center gap-3 px-4 py-3">
        <Image
          src={DEFAULT_MEETING_THUMBNAIL}
          alt=""
          width={80}
          height={80}
          className="h-20 w-20 shrink-0 rounded-2xl bg-orange-50 object-cover"
        />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            className="flex w-full items-center gap-1 text-left"
            onClick={() => alert("준비 중")}
          >
            <h2 className="truncate text-lg font-bold text-seed-gray-900">
              {detail.name}
            </h2>
            <ChevronRight size={20} className="shrink-0 text-seed-gray-500" />
          </button>
          <p className="mt-0.5 text-sm text-seed-gray-500">
            {detail.neighborhood} · 멤버 {detail.member_count}
          </p>
        </div>
      </section>

      <section className="flex justify-around border-b border-seed-gray-100 py-4">
        {ACTION_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className="flex flex-col items-center"
              onClick={() => {
                if ("href" in item && item.href) {
                  router.push(`/meetings/${routeMeetingId}/${item.href}`);
                } else if ("alert" in item && item.alert) {
                  alert(item.alert);
                }
              }}
            >
              <Icon size={28} className="text-seed-gray-600" aria-hidden />
              <span className="mt-1 text-xs text-seed-gray-600">{item.label}</span>
            </button>
          );
        })}
      </section>

      <Tabs
        items={DETAIL_TABS}
        activeKey={detailTab}
        onChange={(key) => setDetailTab(key as DetailTab)}
      />

      <section className="min-h-[120px] px-4 py-4">
        {tabLoading ? (
          <p className="py-8 text-center text-sm text-seed-gray-500">불러오는 중...</p>
        ) : detailTab === "schedule" ? (
          <div className="space-y-6">
            <div>
              <h3 className="mb-3 text-sm font-bold text-seed-gray-900">
                다가올 일정
              </h3>
              {upcomingEvents.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {upcomingEvents.map((ev) => (
                    <li key={ev.event_id}>
                      <MeetingEventCard event={ev} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-seed-gray-400">
                  예정된 일정이 없어요
                </p>
              )}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-bold text-seed-gray-900">
                지난 일정
              </h3>
              {pastEvents.length > 0 ? (
                <ul className="flex flex-col gap-3">
                  {pastEvents.map((ev) => (
                    <li key={ev.event_id}>
                      <MeetingEventCard event={ev} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-seed-gray-400">
                  지난 일정이 없어요
                </p>
              )}
            </div>
          </div>
        ) : placeHistory.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {placeHistory.map((item) => (
              <li key={item.place.place_id}>
                <MeetingPlaceHistoryCard item={item} meetingName={detail.name} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-12 text-center text-sm text-seed-gray-400">
            아직 다녀간 장소가 없어요
          </p>
        )}
      </section>

      <section className="mx-4 my-4">
        <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Hash size={20} className="text-blue-600" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-seed-gray-600">
              멤버들이 서로를 더 쉽게 알아볼 수 있어요
            </p>
            <p className="text-sm font-medium text-seed-gray-900">
              멤버 태그 사용하기
            </p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-seed-gray-400" />
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === 0 ? "bg-seed-carrot-500" : "bg-seed-gray-300"
              }`}
            />
          ))}
        </div>
      </section>

      <section className="px-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setBoardFilter("all")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${
              boardFilter === "all"
                ? "bg-seed-gray-900 text-white"
                : "border border-seed-gray-200 text-seed-gray-600"
            }`}
          >
            전체 {detail.post_count || total}
          </button>
          <button
            type="button"
            onClick={() => setBoardFilter("free")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${
              boardFilter === "free"
                ? "bg-seed-gray-900 text-white"
                : "border border-seed-gray-200 text-seed-gray-600"
            }`}
          >
            자유 게시판
          </button>
          <button
            type="button"
            onClick={() => alert("준비 중")}
            className="shrink-0 rounded-full border border-seed-gray-200 px-4 py-1.5 text-sm text-seed-gray-600"
          >
            + 추가
          </button>
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-seed-gray-500">
          <input type="checkbox" className="rounded-full" disabled />
          인기순으로 보기
        </label>
      </section>

      <section>
        {posts.length > 0 ? (
          posts.map((post) => (
            <MeetingPostCard
              key={post.id}
              post={post}
              meetingId={routeMeetingId}
            />
          ))
        ) : (
          <p className="px-4 py-12 text-center text-sm text-seed-gray-400">
            아직 게시글이 없어요
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-6 right-4 z-20 flex items-center gap-2 rounded-full bg-seed-carrot-500 px-5 py-3 text-white shadow-lg"
      >
        <Pencil size={18} aria-hidden />
        <span className="font-bold">글쓰기</span>
      </button>

      <PostActionSheet
        open={sheetOpen}
        meetingId={routeMeetingId}
        onClose={() => setSheetOpen(false)}
      />
    </div>
  );
}
