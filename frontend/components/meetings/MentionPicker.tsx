"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { quickSearchPlaces, searchUsers } from "@/lib/api";
import type { PlaceQuickSearchItemApi } from "@/lib/types/meeting-comment";
import type { UserSearchItemApi } from "@/lib/types/user";
import type { MentionSelection } from "@/lib/mention-detect";

interface MentionPickerProps {
  /** null = hidden; empty string = show popular results */
  query: string | null;
  onSelect: (item: MentionSelection) => void;
  onClose: () => void;
  /** 모임 동네 — 장소 검색 시 district 우선 정렬 */
  neighborhood?: string;
  /** 모임 ID — 사용자 검색을 멤버로 한정 */
  meetingId?: string;
  /** 이 영역 클릭 시 시트를 닫지 않음 (본문/댓글 입력창) */
  excludeCloseRef?: React.RefObject<HTMLElement | null>;
}

export function MentionPicker({
  query,
  onSelect,
  onClose,
  neighborhood,
  meetingId,
  excludeCloseRef,
}: MentionPickerProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [places, setPlaces] = useState<PlaceQuickSearchItemApi[]>([]);
  const [users, setUsers] = useState<UserSearchItemApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const open = query !== null;

  const flatItems = useMemo<MentionSelection[]>(
    () => [
      ...places.map((p) => ({
        type: "place" as const,
        id: p.place_id,
        name: p.name,
      })),
      ...users.map((u) => ({
        type: "user" as const,
        id: u.user_id,
        name: u.name,
      })),
    ],
    [places, users],
  );

  useEffect(() => {
    if (!open) {
      setPlaces([]);
      setUsers([]);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      void Promise.all([
        quickSearchPlaces(query ?? "", { neighborhood }),
        searchUsers(query ?? "", { meetingId }),
      ])
        .then(([placeData, userData]) => {
          setPlaces(placeData.items);
          setUsers(userData.items);
          setActiveIndex(0);
        })
        .catch(() => {
          setPlaces([]);
          setUsers([]);
        })
        .finally(() => setLoading(false));
    }, 200);

    return () => clearTimeout(timer);
  }, [open, query, neighborhood, meetingId]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (sheetRef.current?.contains(target)) return;
      if (excludeCloseRef?.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, onClose, excludeCloseRef]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (flatItems.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i + 1) % flatItems.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i - 1 + flatItems.length) % flatItems.length);
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSelect(flatItems[activeIndex]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, flatItems, activeIndex, onSelect, onClose]);

  if (!open) return null;

  let rowIndex = 0;

  const handlePick = (item: MentionSelection) => {
    onSelect(item);
  };

  return (
    <div
      ref={sheetRef}
      role="dialog"
      aria-label="멘션 검색"
      className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-md rounded-t-2xl bg-white pb-4 shadow-2xl"
    >
      <div className="mx-auto mt-3 h-1 w-12 shrink-0 rounded-full bg-gray-200" />
      <div className="max-h-[50vh] overflow-y-auto pt-2">
        {loading ? (
          <p className="px-4 py-3 text-sm text-gray-500">검색 중…</p>
        ) : flatItems.length === 0 ? (
          <p className="px-4 py-3 text-sm text-gray-500">검색 결과 없음</p>
        ) : (
          <ul>
            {places.length > 0 ? (
              <li className="px-4 py-2 text-xs font-medium text-gray-500">장소</li>
            ) : null}
            {places.map((place) => {
              const index = rowIndex++;
              return (
                <li key={`place-${place.place_id}`}>
                  <button
                    type="button"
                    className={`flex w-full flex-col gap-0.5 px-4 py-3 text-left ${
                      index === activeIndex ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handlePick({
                        type: "place",
                        id: place.place_id,
                        name: place.name,
                      });
                    }}
                  >
                    <span className="font-medium text-gray-900">{place.name}</span>
                    <span className="text-xs text-gray-500">{place.address}</span>
                  </button>
                </li>
              );
            })}
            {users.length > 0 ? (
              <li className="border-t border-gray-100 px-4 py-2 text-xs font-medium text-gray-500">
                사용자
              </li>
            ) : null}
            {users.map((user) => {
              const index = rowIndex++;
              return (
                <li key={`user-${user.user_id}`}>
                  <button
                    type="button"
                    className={`flex w-full items-center gap-2 px-4 py-3 text-left ${
                      index === activeIndex ? "bg-gray-50" : "hover:bg-gray-50"
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handlePick({
                        type: "user",
                        id: user.user_id,
                        name: user.name,
                      });
                    }}
                  >
                    {user.profile_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.profile_image_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-sm text-gray-600">
                        {user.name.charAt(0)}
                      </span>
                    )}
                    <span className="font-medium text-gray-900">{user.name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** @deprecated Use MentionPicker */
export { MentionPicker as PlaceMentionPicker };
