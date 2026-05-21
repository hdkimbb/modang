"use client";

/**
 * SEED global styles must load in a Client Component.
 * Importing @seed-design/css in the Server layout can break Next vendor-chunks.
 */
import "@seed-design/css/all.css";

export function SeedStyles({ children }: { children: React.ReactNode }) {
  return children;
}
