import Link from "next/link";

interface PageProps {
  params: { id: string };
}

export default function MeetingDetailPage({ params }: PageProps) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-4 py-8">
      <p className="text-base font-bold text-gray-900">
        모임 상세 (준비 중)
      </p>
      <p className="text-sm text-gray-600">ID: {params.id}</p>
      <Link
        href="/meetings/1/events/new"
        className="text-sm text-orange-500 underline"
      >
        일정 만들기로 이동
      </Link>
      <Link href="/meetings" className="text-sm text-gray-500 underline">
        목록으로
      </Link>
    </main>
  );
}
