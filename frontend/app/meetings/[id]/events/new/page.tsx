import { EventFormScreen } from "@/components/meetings/EventFormScreen";

interface PageProps {
  params: { id: string };
}

export default function NewEventPage({ params }: PageProps) {
  return <EventFormScreen meetingId={params.id} />;
}
