import { MobileScreen } from "@/components/layout/MobileScreen";

export default function AwardsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileScreen>{children}</MobileScreen>;
}
