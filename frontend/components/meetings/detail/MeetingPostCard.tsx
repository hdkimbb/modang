"use client";

import type { MouseEvent } from "react";
import {
  Crown,
  Heart,
  MessageCircle,
  MoreVertical,
  Send,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { MentionText } from "@/components/meetings/MentionText";
import { BOARD_TYPE_LABELS } from "@/lib/types/meeting-post";
import type { MeetingPostItemApi } from "@/lib/types/meeting-post";

interface MeetingPostCardProps {
  post: MeetingPostItemApi;
  meetingId: string;
  /** 상세 페이지 등 — 카드 전체 클릭 비활성화 */
  disableNavigation?: boolean;
}

function AuthorAvatar({ name, url }: { name: string; url: string | null }) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt=""
        className="h-10 w-10 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium text-gray-600">
      {name.charAt(0)}
    </div>
  );
}

function PostImages({ urls }: { urls: string[] }) {
  if (urls.length === 0) return null;

  const stop = (e: MouseEvent) => e.stopPropagation();

  if (urls.length === 1) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={urls[0]}
        alt=""
        className="mb-3 w-full rounded-xl object-cover"
        onClick={stop}
      />
    );
  }

  const visible = urls.slice(0, 4);
  const extra = urls.length - visible.length;

  return (
    <div className="mb-3 grid grid-cols-2 gap-1" onClick={stop}>
      {visible.map((url, i) => (
        <div key={url} className="relative aspect-square overflow-hidden rounded-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="" className="h-full w-full object-cover" />
          {i === visible.length - 1 && extra > 0 ? (
            <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-lg font-bold text-white">
              +{extra}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function MeetingPostCard({
  post,
  meetingId,
  disableNavigation = false,
}: MeetingPostCardProps) {
  const router = useRouter();
  const boardLabel =
    BOARD_TYPE_LABELS[post.board_type] ?? post.board_type;

  const goDetail = () => {
    if (disableNavigation) return;
    router.push(`/meetings/${meetingId}/posts/${post.id}`);
  };

  return (
    <article
      className={`border-b border-gray-100 px-4 py-4 ${
        disableNavigation ? "" : "cursor-pointer hover:bg-gray-50/80"
      }`}
      onClick={disableNavigation ? undefined : goDetail}
      onKeyDown={
        disableNavigation
          ? undefined
          : (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                goDetail();
              }
            }
      }
      role={disableNavigation ? undefined : "button"}
      tabIndex={disableNavigation ? undefined : 0}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AuthorAvatar
            name={post.author.name}
            url={post.author.avatar_url}
          />
          <div>
            <p className="flex items-center gap-1 text-sm font-medium text-gray-900">
              {post.author.name}
              {post.author.is_host ? (
                <Crown
                  size={14}
                  className="text-yellow-500"
                  aria-label="호스트"
                />
              ) : null}
            </p>
            <p className="text-xs text-gray-500">
              {post.relative_time} · {boardLabel}
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="메뉴"
          className="text-gray-400"
          onClick={(e) => {
            e.stopPropagation();
            alert("준비 중");
          }}
        >
          <MoreVertical size={20} />
        </button>
      </div>

      <MentionText
        content={post.content}
        mentionPlaces={post.mention_places ?? []}
        mentionUsers={post.mention_users ?? []}
        className="mb-3 text-base text-gray-900"
      />
      <PostImages urls={post.image_urls} />

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-4 text-gray-400">
          <button
            type="button"
            className="flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              alert("준비 중");
            }}
          >
            <Heart size={20} />
            {post.like_count > 0 ? (
              <span className="text-xs text-gray-600">{post.like_count}</span>
            ) : null}
          </button>
          <button
            type="button"
            className="flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              goDetail();
            }}
          >
            <MessageCircle size={20} />
            {post.comment_count > 0 ? (
              <span className="text-xs text-gray-600">
                {post.comment_count}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              alert("준비 중");
            }}
          >
            <Send size={20} />
          </button>
        </div>
        <span className="text-xs text-gray-400">조회 {post.view_count}</span>
      </div>
    </article>
  );
}
