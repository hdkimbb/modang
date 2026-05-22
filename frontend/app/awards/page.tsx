import { Suspense } from "react";

import { AwardsScreen } from "@/components/awards/AwardsScreen";

export default function AwardsPage() {
  return (
    <Suspense
      fallback={
        <p className="px-4 py-24 text-center text-sm text-gray-500">
          불러오는 중...
        </p>
      }
    >
      <AwardsScreen />
    </Suspense>
  );
}
