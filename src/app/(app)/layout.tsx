import { cookies } from "next/headers";
import { AppNav } from "@/components/app-nav";
import { SIDEBAR_COOKIE, isSidebarCollapsed } from "@/lib/sidebar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const collapsed = isSidebarCollapsed((await cookies()).get(SIDEBAR_COOKIE)?.value);
  return (
    <div className="flex min-h-full flex-1 flex-col md:flex-row">
      <AppNav collapsed={collapsed} />
      {/* Room for the bottom bar on a phone. */}
      <div className="flex flex-1 flex-col pb-24 md:pb-0">{children}</div>
    </div>
  );
}
