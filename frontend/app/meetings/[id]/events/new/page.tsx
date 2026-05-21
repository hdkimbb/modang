import { EventFormScreen } from "@/components/meetings/EventFormScreen";

interface PageProps {
  params: { id: string };
}

export default function NewEventPage({ params }: PageProps) {
  const apiMeetingId = params.id === "1" ? "mtg_001" : params.id;
  return (
    <EventFormScreen meetingId={params.id} apiMeetingId={apiMeetingId} />
  );
}
