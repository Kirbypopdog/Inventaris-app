import { AppNav } from "@/components/app-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <AppNav />
      {/* Room for the bottom bar on a phone. */}
      <div className="flex flex-1 flex-col pb-24 md:pb-0">{children}</div>
    </div>
  );
}
