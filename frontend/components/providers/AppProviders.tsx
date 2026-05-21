"use client";

import type { ReactNode } from "react";

import { PersonaSwitcher } from "@/components/dev/PersonaSwitcher";
import { PersonaProvider } from "@/context/PersonaContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <PersonaProvider>
      <PersonaSwitcher />
      {children}
    </PersonaProvider>
  );
}
