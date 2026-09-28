/**
 * Post-login destination guard (no open redirects). Accepts same-site relative paths, and
 * absolute URLs only when they point at `origin`, reduced to their path.
 */
export function safeCallback(value: unknown, origin?: string): string {
  const v = typeof value === "string" ? value : "";
  if (/[\r\n\\]/.test(v)) return "/new";
  if (v.startsWith("/") && !v.startsWith("//")) return v;
  if (origin) {
    try {
      const url = new URL(v);
      if (url.origin === new URL(origin).origin) return `${url.pathname}${url.search}` || "/new";
    } catch {
      // not a URL
    }
  }
  return "/new";
}
