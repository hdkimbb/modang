import { PostDetailScreen } from "@/components/meetings/detail/PostDetailScreen";

interface PageProps {
  params: { id: string; postId: string };
}

export default function MeetingPostDetailPage({ params }: PageProps) {
  return (
    <PostDetailScreen
      routeMeetingId={params.id}
      routePostId={params.postId}
    />
  );
}
