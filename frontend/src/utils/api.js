export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .trim()
  .replace(/\/+$/, "");

export function resolveApiUrl(url) {
  if (typeof url !== "string") return url;
  if (!API_BASE_URL) return url;
  if (!url.startsWith("/api/")) return url;

  return `${API_BASE_URL}${url}`;
}
