/**
 * Where to go after signing in: a same-site path from `?callbackUrl=`, or the
 * profile. Absolute URLs, protocol-relative "//host" and back-slash tricks are
 * ignored so the login page can never be used as an open redirect.
 */
export function safeCallbackPath(raw: string | null | undefined, fallback = "/profile"): string {
  if (!raw) return fallback;
  const value = raw.trim();
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return fallback;
  if (value === "/login" || value.startsWith("/login?") || value === "/register") return fallback;
  return value;
}
