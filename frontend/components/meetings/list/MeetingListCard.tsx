"use client";

import { MapPin, Users } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import {
  DEFAULT_MEETING_THUMBNAIL,
  type MeetingListItem,
} from "@/lib/types/meeting-list";

interface MeetingListCardProps {
  meeting: MeetingListItem;
  isLast?: boolean;
}

export function MeetingListCard({ meeting, isLast }: MeetingListCardProps) {
  const thumbnailSrc =
    meeting.thumbnail_url?.trim() || DEFAULT_MEETING_THUMBNAIL;

  return (
    <Link
      href={`/meetings/${meeting.id}`}
      className={`flex gap-3.5 p-4 transition-colors hover:bg-gray-50 ${
        isLast ? "" : "border-b border-gray-100"
      }`}
    >
      <Image
        src={thumbnailSrc}
        alt={meeting.name}
        width={60}
        height={60}
        className="h-[60px] w-[60px] shrink-0 rounded-2xl bg-gray-100 object-cover"
      />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-base font-bold text-gray-900">
          {meeting.name}
        </h3>
        <p className="mt-0.5 truncate text-sm text-gray-600">
          {meeting.tags.join(" · ")}
        </p>
        <p className="mt-1.5 flex flex-wrap items-center gap-1 text-sm text-gray-600">
          <span className="inline-flex items-center gap-0.5">
            <MapPin size={14} className="text-gray-400" aria-hidden />
            {meeting.district}
          </span>
          <span className="text-gray-400" aria-hidden>
            ·
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Users size={14} className="text-gray-400" aria-hidden />
            {meeting.memberCount}명
          </span>
          <span className="text-gray-400" aria-hidden>
            ·
          </span>
          <span className="text-blue-500">{meeting.statusText}</span>
        </p>
      </div>
    </Link>
  );
}
