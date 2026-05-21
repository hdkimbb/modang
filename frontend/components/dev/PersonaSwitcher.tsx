"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { usePersona } from "@/context/PersonaContext";

export function PersonaSwitcher() {
  const pathname = usePathname();
  const { personas, persona, ready, setPersonaId, isOwner } = usePersona();

  if (!ready) return null;

  const roleLabel = isOwner ? "사장" : "일반";

  return (
    <div
      className="shrink-0 border-b border-amber-200 bg-amber-50 px-3 py-2"
      role="region"
      aria-label="페르소나 전환"
    >
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="persona-select">
          현재 사용자
        </label>
        <span className="text-xs font-medium text-amber-900">현재</span>
        <select
          id="persona-select"
          value={persona.id}
          onChange={(e) => setPersonaId(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-amber-200 bg-white px-2 py-1.5 text-sm text-gray-900"
        >
          {personas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.region}) · {p.role === "owner" ? "사장" : "일반"}
            </option>
          ))}
        </select>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
          {roleLabel}
        </span>
        {isOwner && pathname !== "/owner" ? (
          <Link
            href="/owner"
            className="text-xs font-medium text-orange-700 underline"
          >
            사장 대시보드
          </Link>
        ) : null}
      </div>
    </div>
  );
}
