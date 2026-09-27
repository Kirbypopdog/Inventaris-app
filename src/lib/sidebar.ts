/** Cookie that remembers, per device, that the laptop sidebar is folded to icons. */
export const SIDEBAR_COOKIE = "sidebar";

export function isSidebarCollapsed(value: string | undefined): boolean {
  return value === "collapsed";
}
