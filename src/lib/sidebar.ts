/** Cookie that remembers, per device, that the laptop sidebar is folded to icons. */
export const SIDEBAR_COOKIE = "sidebar";

const ONE_YEAR = 60 * 60 * 24 * 365;

export function isSidebarCollapsed(value: string | undefined): boolean {
  return value === "collapsed";
}

/** The cookie string the browser stores when the sidebar is folded or opened. */
export function sidebarCookie(collapsed: boolean): string {
  return collapsed
    ? `${SIDEBAR_COOKIE}=collapsed; path=/; max-age=${ONE_YEAR}; samesite=lax`
    : `${SIDEBAR_COOKIE}=; path=/; max-age=0; samesite=lax`;
}
