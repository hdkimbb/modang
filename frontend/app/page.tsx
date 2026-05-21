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
        🥕 모당
      </p>
      <Link
        href="/meetings/1/events/new"
        style={{
          fontSize: "var(--seed-font-size-t5)",
          fontWeight: "var(--seed-font-weight-medium)",
          color: "var(--carrot-primary)",
          textDecoration: "underline",
        }}
      >
        일정 만들기 화면으로 이동 →
      </Link>
    </main>
  );
}
