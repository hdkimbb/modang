"use client";

import { Bell, Star, TrendingUp, type LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { usePersona } from "@/context/PersonaContext";

type AdProduct = {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  price: string;
  featured?: boolean;
};

const AD_PRODUCTS: AdProduct[] = [
  {
    id: "search-top",
    icon: TrendingUp,
    title: "검색 상위 노출",
    description: "동네 검색에서 우리 가게가 상단에 노출돼요",
    price: "29,000원 / 7일",
    featured: true,
  },
  {
    id: "new-meeting",
    icon: Bell,
    title: "신규 모임 알림 우선",
    description: "우리 가게 근처 신규 모임에 우선 추천돼요",
    price: "19,000원 / 30일",
  },
  {
    id: "ranking-pin",
    icon: Star,
    title: "랭킹 페이지 핀",
    description: "동네 랭킹 페이지에서 우리 가게가 상단에 고정돼요",
    price: "49,000원 / 14일",
  },
];

function handleProductCta() {
  alert("광고 상품 신청은 곧 출시될 예정이에요.");
}

export function OwnerAdsScreen() {
  const router = useRouter();
  const { persona, isOwner, ready } = usePersona();

  if (ready && !isOwner) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <ScreenHeader
          variant="back"
          title="광고센터"
          onAction={() => router.push("/owner")}
        />
        <p className="px-4 py-24 text-center text-sm text-gray-600">
          광고센터는 사장 계정 전용이에요.
          <br />
          상단에서 <strong>김사장</strong>으로 전환한 뒤 이용해 주세요.
          <br />
          <span className="mt-2 block text-gray-400">
            현재: {persona.name} ({persona.region})
          </span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScreenHeader
        variant="back"
        title="광고센터"
        onAction={() => router.back()}
      />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-8">
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">이번 달 지출</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">0원</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 px-3 py-2.5">
              <p className="text-xs text-gray-500">노출 수</p>
              <p className="mt-0.5 text-lg font-semibold text-gray-900">1,234</p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2.5">
              <p className="text-xs text-gray-500">유입 모임</p>
              <p className="mt-0.5 text-lg font-semibold text-gray-900">3</p>
            </div>
          </div>
        </section>

        <p className="mb-3 mt-6 text-sm text-gray-500">광고 상품</p>

        <ul className="flex flex-col gap-3">
          {AD_PRODUCTS.map((product) => {
            const Icon = product.icon;
            const featured = product.featured === true;
            return (
              <li
                key={product.id}
                className={`rounded-2xl border bg-white p-4 ${
                  featured
                    ? "border-amber-400 ring-1 ring-amber-200"
                    : "border-gray-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                      featured
                        ? "bg-amber-500 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium text-gray-900">
                        {product.title}
                      </h3>
                      {featured ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          추천
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      {product.description}
                    </p>
                    <p className="mt-2 text-sm font-medium text-gray-900">
                      {product.price}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleProductCta}
                  className={`mt-4 w-full rounded-full py-2.5 text-sm font-medium text-white ${
                    featured ? "bg-orange-500" : "bg-gray-900"
                  }`}
                >
                  신청하기
                </button>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 text-center text-xs text-gray-400">
          광고는 모당 정책에 따라 검수 후 노출됩니다
        </p>
      </div>
    </div>
  );
}
