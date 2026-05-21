"use client";

import { MobileScreen } from "@/components/layout/MobileScreen";
import { EventDraftProvider } from "@/context/EventDraftContext";

export default function EventNewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EventDraftProvider>
      <MobileScreen>{children}</MobileScreen>
    </EventDraftProvider>
  );
}
