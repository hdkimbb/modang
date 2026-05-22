"use client";

import { ChevronRight, Megaphone } from "lucide-react";
import Link from "next/link";

export function AdCenterBanner() {
  return (
    <Link
      href="/owner/ads"
      className="flex w-full items-center gap-3 rounded-2xl border border-orange-200 bg-orange-50 p-4 transition-colors hover:border-orange-300 hover:bg-orange-100/80"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white">
        <Megaphone className="h-5 w-5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900">광고센터</p>
        <p className="mt-0.5 text-sm text-gray-600">
          모임에 우리 가게를 더 노출해요
        </p>
      </div>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-orange-600"
        strokeWidth={1.75}
        aria-hidden
      />
    </Link>
  );
}
