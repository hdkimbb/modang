"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getPersonas } from "@/lib/api";
import type { Persona } from "@/lib/types/persona";

const STORAGE_KEY = "modang:personaId";
const FALLBACK_PERSONA: Persona = {
  id: "u_001",
  name: "민지",
  region: "성수동",
  role: "user",
  owned_place_id: null,
};

type PersonaContextValue = {
  personas: Persona[];
  persona: Persona;
  userId: string;
  isOwner: boolean;
  ready: boolean;
  setPersonaId: (id: string) => void;
};

const PersonaContext = createContext<PersonaContextValue | null>(null);

export function PersonaProvider({ children }: { children: ReactNode }) {
  const [personas, setPersonas] = useState<Persona[]>([FALLBACK_PERSONA]);
  const [personaId, setPersonaIdState] = useState(FALLBACK_PERSONA.id);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setPersonaIdState(stored);
    setReady(true);

    getPersonas()
      .then((items) => {
        if (items.length > 0) setPersonas(items);
        if (stored && items.some((p) => p.id === stored)) return;
        if (items.length > 0 && !items.some((p) => p.id === stored)) {
          setPersonaIdState(items[0].id);
          localStorage.setItem(STORAGE_KEY, items[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  const setPersonaId = useCallback((id: string) => {
    setPersonaIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const persona = useMemo(() => {
    return personas.find((p) => p.id === personaId) ?? personas[0] ?? FALLBACK_PERSONA;
  }, [personas, personaId]);

  const value = useMemo<PersonaContextValue>(
    () => ({
      personas,
      persona,
      userId: persona.id,
      isOwner: persona.role === "owner",
      ready,
      setPersonaId,
    }),
    [personas, persona, ready, setPersonaId],
  );

  return (
    <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>
  );
}

export function usePersona(): PersonaContextValue {
  const ctx = useContext(PersonaContext);
  if (!ctx) {
    throw new Error("usePersona must be used within PersonaProvider");
  }
  return ctx;
}
