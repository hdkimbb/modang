import { CreatePostScreen } from "@/components/meetings/create/CreatePostScreen";

interface PageProps {
  params: { id: string };
}

export default function NewMeetingPostPage({ params }: PageProps) {
  return <CreatePostScreen routeMeetingId={params.id} />;
}
