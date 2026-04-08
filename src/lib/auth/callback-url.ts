export function sanitizeCallbackUrl(callbackUrl?: string | null, fallback = "/dashboard") {
  if (!callbackUrl || typeof callbackUrl !== "string") {
    return fallback;
  }

  if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//")) {
    return fallback;
  }

  return callbackUrl;
}

export function sanitizeClientRedirectUrl(
  url?: string | null,
  fallback = "/dashboard",
) {
  const safeFallback = sanitizeCallbackUrl(fallback, "/dashboard");

  if (!url || typeof url !== "string") {
    return safeFallback;
  }

  try {
    const parsed = new URL(url, "http://localhost");
    const params = new URLSearchParams(parsed.search);

    params.delete("password");

    const search = params.toString();
    const candidate = `${parsed.pathname}${search ? `?${search}` : ""}${parsed.hash}`;

    return sanitizeCallbackUrl(candidate, safeFallback);
  } catch {
    return safeFallback;
  }
}
