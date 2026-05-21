import { MobileScreen } from "@/components/layout/MobileScreen";

export default function OwnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <MobileScreen>{children}</MobileScreen>;
}
