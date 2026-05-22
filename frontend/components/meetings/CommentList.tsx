"use client";

import { Crown } from "lucide-react";

import type { MeetingPostCommentApi } from "@/lib/types/meeting-comment";

import { CommentText } from "./CommentText";

interface CommentListProps {
  comments: MeetingPostCommentApi[];
}

function CommentAvatar({ name, url }: { name: string; url: string | null }) {
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

export function CommentList({ comments }: CommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-gray-400">
        아직 댓글이 없어요. 가장 먼저 댓글을 남겨보세요.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-gray-100">
      {comments.map((comment) => (
        <li key={comment.id} className="flex gap-2 px-4 py-4">
          <CommentAvatar
            name={comment.author.name}
            url={comment.author.avatar_url}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {comment.author.name}
              {comment.author.is_host ? (
                <Crown
                  size={14}
                  className="ml-0.5 inline text-yellow-500"
                  aria-label="호스트"
                />
              ) : null}
              <span className="font-normal text-gray-400">
                {" "}
                · {comment.relative_time}
              </span>
            </p>
            <CommentText
              content={comment.content}
              mentions={comment.mentions}
              mentionUsers={comment.mention_users ?? []}
              className="mt-1"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
