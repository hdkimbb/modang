import { MobileScreen } from "@/components/layout/MobileScreen";

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileScreen>{children}</MobileScreen>;
}
