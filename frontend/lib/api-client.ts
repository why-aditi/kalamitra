interface RequestOptions extends RequestInit {
  /** Attach the Firebase ID token. Defaults to true. */
  requiresAuth?: boolean;
  /**
   * Send the token when there is one, but do not fail when there is not.
   * For endpoints that are public yet treat a known caller better — the Gemini
   * proxy rate-limits per user when it can identify one and per IP otherwise,
   * so a signed-in visitor should not share a bucket with a whole CGNAT range.
   * Takes precedence over `requiresAuth`.
   */
  optionalAuth?: boolean;
  /** Cancel this request when the signal aborts (e.g. a superseded filter change). */
  signal?: AbortSignal;
}

export interface ApiError extends Error {
  status?: number;
  data?: unknown;
  /**
   * Seconds to wait, parsed from the `Retry-After` header on a 429.
   *
   * NOTE: cross-origin this is only populated if the API sends
   * `Access-Control-Expose-Headers: Retry-After` — `Retry-After` is not
   * CORS-safelisted, so without that the browser hides it and this stays
   * undefined. Callers must degrade gracefully.
   */
  retryAfter?: number;
}

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

/**
 * The token is kept fresh by the auth provider's onIdTokenChanged subscription,
 * so reading it straight from storage is enough. (The old fallback read a
 * separate `auth-token` key that nothing ever wrote — it was always null.)
 */
const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
};

/** True when a rejection came from an AbortController rather than a real failure. */
export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (isJson && (data?.detail || data?.message)) || `Request failed with status ${response.status}`;
    const error = new Error(typeof message === 'string' ? message : 'API Error') as ApiError;
    error.status = response.status;
    error.data = data;

    const retryAfter = Number(response.headers.get('Retry-After'));
    if (Number.isFinite(retryAfter) && retryAfter > 0) {
      error.retryAfter = retryAfter;
    }

    throw error;
  }

  return data;
}

export async function apiRequest<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requiresAuth = true, optionalAuth = false, headers: initHeaders, ...fetchOptions } = options;

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE_URL}${normalizedEndpoint}`;

  const headers = new Headers(initHeaders);
  if (!(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (optionalAuth) {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  } else if (requiresAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, { ...fetchOptions, headers });
  return handleResponse(response);
}

/** Build a query string, dropping empty values and `all` sentinels. */
export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const str = String(value).trim();
    if (!str || str === 'all') continue;
    search.set(key, str);
  }
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data?: unknown, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
