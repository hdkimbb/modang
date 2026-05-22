"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { ScreenHeader } from "@/components/layout/ScreenHeader";
import { getRanking } from "@/lib/api";
import {
  RANKING_CATEGORIES,
  RANKING_DISTRICTS,
  type RankingCategoryId,
  type RankingDistrictId,
  type RankingResponseApi,
} from "@/lib/types/ranking";

import { RankingListItem } from "./RankingListItem";

function parseDistrictParam(value: string | null): RankingDistrictId {
  if (value && RANKING_DISTRICTS.some((d) => d.id === value)) {
    return value as RankingDistrictId;
  }
  return "성수동";
}

function parseCategoryParam(value: string | null): RankingCategoryId {
  if (value && RANKING_CATEGORIES.some((c) => c.id === value)) {
    return value as RankingCategoryId;
  }
  return "cafe";
}

export function RankingScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [district, setDistrict] = useState<RankingDistrictId>(() =>
    parseDistrictParam(searchParams.get("district")),
  );
  const [category, setCategory] = useState<RankingCategoryId>(() =>
    parseCategoryParam(searchParams.get("category")),
  );
  const [data, setData] = useState<RankingResponseApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getRanking(district, category);
      setData(result);
    } catch {
      setError("랭킹을 불러오지 못했어요");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [district, category]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScreenHeader
        variant="back"
        title="랭킹"
        onAction={() => router.back()}
        divider
        rightSlot={
          <Link
            href="/awards"
            className="text-sm font-medium text-amber-700"
          >
            어워드
          </Link>
        }
      />

      <section className="border-b border-gray-100 px-4 py-3">
        <label className="mb-2 block text-xs font-medium text-gray-500">
          동네
        </label>
        <select
          value={district}
          onChange={(e) => setDistrict(e.target.value as RankingDistrictId)}
          className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900"
        >
          {RANKING_DISTRICTS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </section>

      <div className="shrink-0 border-b border-gray-100">
        <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-3">
          {RANKING_CATEGORIES.map((chip) => {
            const active = category === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setCategory(chip.id)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {data ? (
          <p className="mb-4 text-sm text-gray-500">
            {data.season_label} 시즌{" "}
            {data.season_status === "active" ? "(실시간)" : "마감"}
          </p>
        ) : null}

        {loading ? (
          <p className="py-16 text-center text-sm text-gray-500">불러오는 중...</p>
        ) : error ? (
          <p className="py-16 text-center text-sm text-red-600">{error}</p>
        ) : data && data.items.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {data.items.map((item) => (
              <li key={item.place.place_id}>
                <RankingListItem item={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-16 text-center text-sm text-gray-400">
            이 동네·카테고리에 랭킹 데이터가 아직 없어요
          </p>
        )}
      </div>
    </div>
  );
}
