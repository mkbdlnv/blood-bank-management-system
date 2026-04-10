import axios from "axios";
import { API_BASE_URL, resolveApiUrl } from "./api";

let isConfigured = false;

function patchFetch() {
  if (typeof globalThis.fetch !== "function" || typeof window === "undefined") {
    return;
  }

  const originalFetch = globalThis.fetch.bind(globalThis);

  globalThis.fetch = (input, init) => {
    if (typeof input === "string") {
      return originalFetch(resolveApiUrl(input), init);
    }

    if (typeof URL !== "undefined" && input instanceof URL) {
      return originalFetch(resolveApiUrl(input.toString()), init);
    }

    if (typeof Request !== "undefined" && input instanceof Request && API_BASE_URL) {
      const url = new URL(input.url, window.location.origin);

      if (url.origin === window.location.origin && url.pathname.startsWith("/api/")) {
        const rewrittenUrl = `${API_BASE_URL}${url.pathname}${url.search}${url.hash}`;
        return originalFetch(new Request(rewrittenUrl, input), init);
      }
    }

    return originalFetch(input, init);
  };
}

export function configureApiClient() {
  if (isConfigured) return;
  isConfigured = true;

  if (API_BASE_URL) {
    axios.defaults.baseURL = API_BASE_URL;
  }

  patchFetch();
}
