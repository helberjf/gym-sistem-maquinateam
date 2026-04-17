export function getAppUrl(origin?: string | null): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.AUTH_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    origin?.trim();

  if (url) return url.replace(/\/+$/, "");

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing NEXT_PUBLIC_APP_URL, AUTH_URL, or NEXTAUTH_URL in production. " +
        "Set at least one of these environment variables.",
    );
  }

  return "http://localhost:3000";
}
