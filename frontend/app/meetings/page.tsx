"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { PendingRatingsSection } from "@/components/meetings/PendingRatingsSection";
import { CreateMeetingFab } from "@/components/meetings/list/CreateMeetingFab";
import { MeetingListCard } from "@/components/meetings/list/MeetingListCard";
import { MeetingsCategoryFilter } from "@/components/meetings/list/MeetingsCategoryFilter";
import { MeetingsHeader } from "@/components/meetings/list/MeetingsHeader";
import { MeetingsSearchBar } from "@/components/meetings/list/MeetingsSearchBar";
import { MeetingsSortBar } from "@/components/meetings/list/MeetingsSortBar";
import { getMeetings } from "@/lib/api";
import { filterMeetings, MOCK_MEETING_LIST } from "@/lib/mocks/meetings";
import { mapMeetingApiToListItem } from "@/lib/meetings-map";
import type { MeetingCategoryFilter, MeetingListItem } from "@/lib/types/meeting-list";

export default function MeetingsPage() {
  const [category, setCategory] = useState<MeetingCategoryFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(true);
  const [meetings, setMeetings] = useState<MeetingListItem[]>(MOCK_MEETING_LIST);
  const [loading, setLoading] = useState(true);

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getMeetings();
      if (items.length > 0) {
        setMeetings(items.map(mapMeetingApiToListItem));
      } else {
        setMeetings(MOCK_MEETING_LIST);
      }
    } catch {
      setMeetings(MOCK_MEETING_LIST);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeetings();
  }, [loadMeetings]);

  const filtered = useMemo(
    () => filterMeetings(meetings, category, searchQuery),
    [meetings, category, searchQuery],
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col pb-28">
      <MeetingsHeader onSearchClick={() => setShowSearch((v) => !v)} />
      <PendingRatingsSection />
      {showSearch ? (
        <MeetingsSearchBar value={searchQuery} onChange={setSearchQuery} />
      ) : null}
      <MeetingsCategoryFilter selected={category} onChange={setCategory} />
      <MeetingsSortBar />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500">
            모임 목록 불러오는 중…
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-gray-500">
            조건에 맞는 모임이 없어요.
          </p>
        ) : (
          <ul>
            {filtered.map((meeting, index) => (
              <li key={meeting.id}>
                <MeetingListCard
                  meeting={meeting}
                  isLast={index === filtered.length - 1}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
      <CreateMeetingFab />
    </div>
  );
}
