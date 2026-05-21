import { MobileScreen } from "@/components/layout/MobileScreen";

export default function MeetingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileScreen>{children}</MobileScreen>;
}
