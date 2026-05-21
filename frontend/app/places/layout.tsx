import { MobileScreen } from "@/components/layout/MobileScreen";

export default function PlacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileScreen>{children}</MobileScreen>;
}
