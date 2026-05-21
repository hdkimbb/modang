import Link from "next/link";

export default function Home() {
  return (
    <main
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-6 px-4"
      style={{ background: "var(--seed-color-bg-layer-default)" }}
    >
      <p
        style={{
          fontSize: "var(--seed-font-size-t7)",
          fontWeight: "var(--seed-font-weight-bold)",
        }}
      >
        모당
      </p>
      <Link
        href="/meetings"
        style={{
          fontSize: "var(--seed-font-size-t5)",
          fontWeight: "var(--seed-font-weight-medium)",
          color: "var(--carrot-primary)",
          textDecoration: "underline",
        }}
      >
        모임 탭 보기 →
      </Link>
      <Link
        href="/ranking"
        style={{
          fontSize: "var(--seed-font-size-t5)",
          fontWeight: "var(--seed-font-weight-medium)",
          color: "var(--carrot-primary)",
          textDecoration: "underline",
        }}
      >
        우리동네 랭킹 →
      </Link>
      <Link
        href="/meetings/1/events/new"
        style={{
          fontSize: "var(--seed-font-size-t4)",
          color: "var(--seed-color-fg-neutral-subtle)",
          textDecoration: "underline",
        }}
      >
        일정 만들기 (개발)
      </Link>
      <Link
        href="/owner"
        style={{
          fontSize: "var(--seed-font-size-t4)",
          color: "var(--seed-color-fg-neutral-subtle)",
          textDecoration: "underline",
        }}
      >
        사장 대시보드 →
      </Link>
      <p
        style={{
          fontSize: "var(--seed-font-size-t3)",
          color: "var(--seed-color-fg-neutral-subtle)",
          textAlign: "center",
        }}
      >
        상단 바에서 페르소나(민지·준호·김사장 등)를 전환할 수 있어요
      </p>
    </main>
  );
}
