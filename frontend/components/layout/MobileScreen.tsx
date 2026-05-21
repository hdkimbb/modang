import type { ReactNode } from "react";

export function MobileScreen({ children }: { children: ReactNode }) {
  return (
    <div
      className="mx-auto flex min-h-dvh w-full max-w-md flex-col bg-white"
      style={{ color: "var(--seed-color-fg-neutral)" }}
    >
      {children}
    </div>
  );
}
