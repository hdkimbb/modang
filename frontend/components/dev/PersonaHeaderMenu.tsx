"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { usePersona } from "@/context/PersonaContext";

type PersonaHeaderMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Owner NavigationTop title 영역용 페르소나 전환 메뉴 */
export function PersonaHeaderMenu({ open, onOpenChange }: PersonaHeaderMenuProps) {
  const { personas, persona, setPersonaId, isOwner } = usePersona();
  const pathname = usePathname();
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);

  const handlePersonaSelect = (id: string) => {
    const next = personas.find((p) => p.id === id);
    setPersonaId(id);
    onOpenChange(false);
    if (!next) return;

    const onOwnerRoute =
      pathname === "/owner" || pathname.startsWith("/owner/");

    if (next.role !== "owner" && onOwnerRoute) {
      router.push("/meetings");
      return;
    }
    if (next.role === "owner" && !onOwnerRoute) {
      router.push("/owner");
    }
  };

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (panelRef.current?.contains(e.target as Node)) return;
      onOpenChange(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open, onOpenChange]);

  if (!open) return null;

  const roleLabel = isOwner ? "사장" : "일반";

  return (
    <div
      ref={panelRef}
      className="absolute left-0 right-0 top-full z-30 border-b border-seed-gray-200 bg-seed-gray-00 px-4 py-3 shadow-md"
      role="dialog"
      aria-label="사용자 전환"
    >
      <p className="mb-2 text-xs font-medium text-seed-gray-600">계정 전환</p>
      <label className="sr-only" htmlFor="persona-header-select">
        현재 사용자
      </label>
      <select
        id="persona-header-select"
        value={persona.id}
        onChange={(e) => handlePersonaSelect(e.target.value)}
        className="w-full rounded-lg border border-seed-gray-300 bg-seed-gray-00 px-3 py-2 text-sm text-seed-gray-900"
      >
        {personas.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.region}) · {p.role === "owner" ? "사장" : "일반"}
          </option>
        ))}
      </select>
      <p className="mt-2 text-xs text-seed-gray-500">
        현재: {persona.name} · {roleLabel}
      </p>
      {isOwner ? (
        <Link
          href="/owner"
          className="mt-2 inline-block text-xs font-medium text-seed-carrot-500"
          onClick={() => onOpenChange(false)}
        >
          사장 대시보드
        </Link>
      ) : null}
    </div>
  );
}
