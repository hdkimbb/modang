import { Suspense } from "react";

import { EventFormScreen } from "@/components/meetings/EventFormScreen";

interface PageProps {
  params: { id: string };
}

function NewEventContent({ meetingId }: { meetingId: string }) {
  const apiMeetingId = meetingId === "1" ? "mtg_001" : meetingId;
  return (
    <EventFormScreen meetingId={meetingId} apiMeetingId={apiMeetingId} />
  );
}

export default function NewEventPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-24 text-center text-sm text-gray-500">
          불러오는 중...
        </p>
      }
    >
      <NewEventContent meetingId={params.id} />
    </Suspense>
  );
}
