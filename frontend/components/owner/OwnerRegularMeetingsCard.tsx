"use client";

import { Users } from "lucide-react";

import type { OwnerRegularMeetingItem } from "@/lib/types/owner";

type OwnerRegularMeetingsCardProps = {
  items: OwnerRegularMeetingItem[];
};

export function OwnerRegularMeetingsCard({ items }: OwnerRegularMeetingsCardProps) {
  const isEmpty = items.length === 0;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-orange-500" strokeWidth={1.75} aria-hidden />
        <div>
          <h2 className="text-base font-bold text-gray-900">단골 모임</h2>
          <p className="text-xs text-gray-500">우리 가게를 자주 찾는 모임들</p>
        </div>
      </div>

      {isEmpty ? (
        <p className="py-8 text-center text-sm text-gray-400">
          아직 자주 찾는 모임이 없어요
        </p>
      ) : (
        <ul className="mt-4 divide-y divide-gray-100">
          {items.map((item) => (
            <li key={item.meeting_id} className="py-3 first:pt-0 last:pb-0">
              <p className="font-medium text-gray-900">{item.title}</p>
              <p className="mt-0.5 text-sm text-gray-600">
                {item.category} · {item.visit_count}회 방문
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
