"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Place } from "@/lib/types/place";
import {
  DEFAULT_EVENT_DRAFT,
  type EventDraft,
  type ExpandedSection,
} from "@/lib/types/event-draft";

interface EventDraftContextValue extends EventDraft {
  setExpandedSection: (section: ExpandedSection) => void;
  toggleSection: (section: Exclude<ExpandedSection, null>) => void;
  setDate: (date: Date) => void;
  setTime: (time: string) => void;
  setRepeat: (repeat: string) => void;
  setPlace: (place: Place | null) => void;
  setCapacity: (capacity: number) => void;
  toggleCondition: (label: string) => void;
  toggleFormat: (label: string) => void;
}

const EventDraftContext = createContext<EventDraftContextValue | null>(null);

export function EventDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<EventDraft>(DEFAULT_EVENT_DRAFT);

  const setExpandedSection = useCallback((section: ExpandedSection) => {
    setDraft((prev) => ({ ...prev, expandedSection: section }));
  }, []);

  const toggleSection = useCallback((section: Exclude<ExpandedSection, null>) => {
    setDraft((prev) => ({
      ...prev,
      expandedSection: prev.expandedSection === section ? null : section,
    }));
  }, []);

  const setDate = useCallback((date: Date) => {
    setDraft((prev) => ({ ...prev, date }));
  }, []);

  const setTime = useCallback((time: string) => {
    setDraft((prev) => ({ ...prev, time }));
  }, []);

  const setRepeat = useCallback((repeat: string) => {
    setDraft((prev) => ({ ...prev, repeat }));
  }, []);

  const setPlace = useCallback((place: Place | null) => {
    setDraft((prev) => ({ ...prev, place }));
  }, []);

  const setCapacity = useCallback((capacity: number) => {
    setDraft((prev) => ({
      ...prev,
      capacity: Math.max(2, Math.min(99, capacity)),
    }));
  }, []);

  const toggleInList = (list: string[], label: string) => {
    if (list.includes(label)) {
      return list.filter((item) => item !== label);
    }
    return [...list, label];
  };

  const toggleCondition = useCallback((label: string) => {
    setDraft((prev) => ({
      ...prev,
      conditions: toggleInList(prev.conditions, label),
    }));
  }, []);

  const toggleFormat = useCallback((label: string) => {
    setDraft((prev) => ({
      ...prev,
      formats: toggleInList(prev.formats, label),
    }));
  }, []);

  const value = useMemo<EventDraftContextValue>(
    () => ({
      ...draft,
      setExpandedSection,
      toggleSection,
      setDate,
      setTime,
      setRepeat,
      setPlace,
      setCapacity,
      toggleCondition,
      toggleFormat,
    }),
    [
      draft,
      setExpandedSection,
      toggleSection,
      setDate,
      setTime,
      setRepeat,
      setPlace,
      setCapacity,
      toggleCondition,
      toggleFormat,
    ],
  );

  return (
    <EventDraftContext.Provider value={value}>
      {children}
    </EventDraftContext.Provider>
  );
}

export function useEventDraft() {
  const ctx = useContext(EventDraftContext);
  if (!ctx) {
    throw new Error("useEventDraft must be used within EventDraftProvider");
  }
  return ctx;
}
