"use client";

import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { NavigationTop } from "@/components/common/NavigationTop";
import { CommentInput } from "@/components/meetings/CommentInput";
import { CommentList } from "@/components/meetings/CommentList";
import { usePersona } from "@/context/PersonaContext";
import {
  createPostComment,
  getMeetingDetail,
  getMeetingPost,
  getMeetingPosts,
  getPostComments,
} from "@/lib/api";
import { resolveApiMeetingId } from "@/lib/resolve-meeting-id";
import type { MeetingPostCommentApi } from "@/lib/types/meeting-comment";
import type { MeetingPostItemApi } from "@/lib/types/meeting-post";

import { MeetingPostCard } from "./MeetingPostCard";

interface PostDetailScreenProps {
  routeMeetingId: string;
  routePostId: string;
}

export function PostDetailScreen({
  routeMeetingId,
  routePostId,
}: PostDetailScreenProps) {
  const router = useRouter();
  const apiMeetingId = resolveApiMeetingId(routeMeetingId);
  const { userId } = usePersona();

  const [meetingName, setMeetingName] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [post, setPost] = useState<MeetingPostItemApi | null>(null);
  const [comments, setComments] = useState<MeetingPostCommentApi[]>([]);
  const [prevPost, setPrevPost] = useState<MeetingPostItemApi | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [detail, postData, commentsData, postsData] = await Promise.all([
        getMeetingDetail(apiMeetingId),
        getMeetingPost(apiMeetingId, routePostId),
        getPostComments(apiMeetingId, routePostId),
        getMeetingPosts(apiMeetingId, { limit: 50 }),
      ]);
      setMeetingName(detail.name);
      setNeighborhood(detail.neighborhood);
      setPost(postData);
      setComments(commentsData.items);

      const sorted = [...postsData.items].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
      const idx = sorted.findIndex((p) => p.id === routePostId);
      if (idx >= 0 && idx < sorted.length - 1) {
        setPrevPost(sorted[idx + 1]);
      } else {
        setPrevPost(null);
      }
    } catch {
      alert("게시글을 불러오지 못했어요");
    } finally {
      setLoading(false);
    }
  }, [apiMeetingId, routePostId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCommentSubmit = useCallback(
    async (payload: {
      content: string;
      mention_place_ids: string[];
      mention_user_ids: string[];
    }) => {
      const created = await createPostComment(
        apiMeetingId,
        routePostId,
        {
          author_user_id: userId,
          ...payload,
        },
      );
      setComments((prev) => [...prev, created]);
      setPost((p) =>
        p ? { ...p, comment_count: p.comment_count + 1 } : p,
      );
    },
    [apiMeetingId, routePostId, userId],
  );

  const postWithUpdatedCount = useMemo(() => {
    if (!post) return null;
    return { ...post, comment_count: comments.length };
  }, [post, comments.length]);

  if (loading) {
    return (
      <p className="px-4 py-24 text-center text-sm text-gray-500">
        불러오는 중...
      </p>
    );
  }

  if (!postWithUpdatedCount) {
    return (
      <p className="px-4 py-24 text-center text-sm text-gray-400">
        게시글을 표시할 수 없어요
      </p>
    );
  }

  return (
    <div className="flex min-h-dvh w-full flex-col bg-white pb-20">
      <NavigationTop
        variant="sub"
        title={meetingName}
        onBack={() => router.back()}
        divider
        className="sticky top-0 z-10"
        rightItems={[
          <button
            key="menu"
            type="button"
            aria-label="메뉴"
            className="text-seed-gray-900"
          >
            <Menu size={24} strokeWidth={2} />
          </button>,
        ]}
      />

      <div className="border-b border-gray-100 bg-blue-50 px-4 py-3 text-sm text-gray-700">
        모임 상단에 사진을 노출하려면, 사진이 포함된 게시글을 작성해보세요.
      </div>

      <MeetingPostCard
        post={postWithUpdatedCount}
        meetingId={routeMeetingId}
        disableNavigation
      />

      <CommentList comments={comments} />

      {prevPost ? (
        <button
          type="button"
          onClick={() =>
            router.push(`/meetings/${routeMeetingId}/posts/${prevPost.id}`)
          }
          className="mx-4 mb-4 flex items-start gap-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-left"
        >
          <span className="shrink-0 rounded bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
            이전
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-gray-900">
              {prevPost.content.slice(0, 80)}
              {prevPost.content.length > 80 ? "…" : ""}
            </p>
            <p className="mt-0.5 text-xs text-gray-500">
              {prevPost.relative_time}
            </p>
          </div>
        </button>
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 z-20 mx-auto max-w-md">
        <CommentInput
          onSubmit={handleCommentSubmit}
          neighborhood={neighborhood || undefined}
          meetingId={apiMeetingId}
        />
      </div>
    </div>
  );
}
