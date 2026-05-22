"use client";

import {
  ArrowLeft,
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
import { useCallback, useEffect, useState } from "react";

import { PostActionSheet } from "@/components/meetings/PostActionSheet";
import { getMeetingDetail, getMeetingPosts } from "@/lib/api";
import { resolveApiMeetingId } from "@/lib/resolve-meeting-id";
import { DEFAULT_MEETING_THUMBNAIL } from "@/lib/types/meeting-list";
import type { MeetingDetailApi } from "@/lib/types/meeting-detail";
import type { MeetingPostItemApi } from "@/lib/types/meeting-post";

import { MeetingPostCard } from "./MeetingPostCard";

type BoardFilter = "all" | "free";

interface MeetingDetailScreenProps {
  routeMeetingId: string;
}

const ACTION_ITEMS = [
  { id: "schedule", label: "일정", icon: Calendar, href: "events/new" },
  { id: "challenge", label: "챌린지", icon: Flame, alert: "준비 중" },
  { id: "chat", label: "채팅", icon: MessageCircle, alert: "준비 중" },
  { id: "members", label: "멤버", icon: Users, alert: "준비 중" },
] as const;

export function MeetingDetailScreen({ routeMeetingId }: MeetingDetailScreenProps) {
  const router = useRouter();
  const apiMeetingId = resolveApiMeetingId(routeMeetingId);

  const [detail, setDetail] = useState<MeetingDetailApi | null>(null);
  const [posts, setPosts] = useState<MeetingPostItemApi[]>([]);
  const [total, setTotal] = useState(0);
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
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

  if (loading) {
    return (
      <p className="px-4 py-24 text-center text-sm text-gray-500">
        불러오는 중...
      </p>
    );
  }

  if (!detail) {
    return (
      <p className="px-4 py-24 text-center text-sm text-gray-400">
        모임을 표시할 수 없어요
      </p>
    );
  }

  return (
    <div className="relative min-h-dvh w-full bg-white pb-28">
      <header className="sticky top-0 z-10 flex items-center justify-between bg-white px-4 py-3">
        <button
          type="button"
          aria-label="뒤로"
          onClick={() => router.back()}
          className="p-1 text-gray-900"
        >
          <ArrowLeft size={24} />
        </button>
        <div className="flex items-center gap-3 text-gray-900">
          <button type="button" aria-label="채팅" className="p-1">
            <MessageCircle size={24} />
          </button>
          <button type="button" aria-label="검색" className="p-1">
            <Search size={24} />
          </button>
          <button type="button" aria-label="메뉴" className="p-1">
            <Menu size={24} />
          </button>
        </div>
      </header>

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
            <h1 className="truncate text-lg font-bold text-gray-900">
              {detail.name}
            </h1>
            <ChevronRight size={20} className="shrink-0 text-gray-400" />
          </button>
          <p className="mt-0.5 text-sm text-gray-500">
            {detail.neighborhood} · 멤버 {detail.member_count}
          </p>
        </div>
      </section>

      <section className="flex justify-around border-b border-gray-100 py-4">
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
              <Icon size={28} className="text-gray-700" aria-hidden />
              <span className="mt-1 text-xs text-gray-700">{item.label}</span>
            </button>
          );
        })}
      </section>

      <section className="mx-4 my-4">
        <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100">
            <Hash size={20} className="text-blue-600" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-700">
              멤버들이 서로를 더 쉽게 알아볼 수 있어요
            </p>
            <p className="text-sm font-medium text-gray-900">
              멤버 태그 사용하기
            </p>
          </div>
          <ChevronRight size={20} className="shrink-0 text-gray-400" />
        </div>
        <div className="mt-3 flex justify-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={`h-1.5 w-1.5 rounded-full ${
                i === 0 ? "bg-orange-500" : "bg-gray-300"
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
                ? "bg-gray-900 text-white"
                : "border border-gray-200 text-gray-700"
            }`}
          >
            전체 {detail.post_count || total}
          </button>
          <button
            type="button"
            onClick={() => setBoardFilter("free")}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${
              boardFilter === "free"
                ? "bg-gray-900 text-white"
                : "border border-gray-200 text-gray-700"
            }`}
          >
            자유 게시판
          </button>
          <button
            type="button"
            onClick={() => alert("준비 중")}
            className="shrink-0 rounded-full border border-gray-200 px-4 py-1.5 text-sm text-gray-700"
          >
            + 추가
          </button>
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-gray-500">
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
          <p className="px-4 py-12 text-center text-sm text-gray-400">
            아직 게시글이 없어요
          </p>
        )}
      </section>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className="fixed bottom-6 right-4 z-20 flex items-center gap-2 rounded-full bg-orange-500 px-5 py-3 text-white shadow-lg"
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
