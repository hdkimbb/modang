import { MeetingDetailScreen } from "@/components/meetings/detail/MeetingDetailScreen";

interface PageProps {
  params: { id: string };
}

export default function MeetingDetailPage({ params }: PageProps) {
  return <MeetingDetailScreen routeMeetingId={params.id} />;
}
