import { Suspense } from "react";

import { RankingScreen } from "@/components/ranking/RankingScreen";

export default function RankingPage() {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-24 text-center text-sm text-gray-500">
          불러오는 중...
        </p>
      }
    >
      <RankingScreen />
    </Suspense>
  );
}
