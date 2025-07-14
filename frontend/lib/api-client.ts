import { getAuthCookie } from './auth-utils';

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

interface ApiError extends Error {
  status?: number;
  data?: any;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('accessToken') || getAuthCookie();
};

async function handleResponse(response: Response) {
  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const error = new Error(isJson ? data.message || 'API Error' : 'Network Error') as ApiError;
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;

  // Ensure the endpoint starts with a slash
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}${normalizedEndpoint}`;

  // Prepare headers
  const headers = new Headers(fetchOptions.headers);
  headers.set('Content-Type', 'application/json');

  // Add authorization header if required
  if (requiresAuth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...fetchOptions,
    headers,
  };

  try {
    const response = await fetch(url, config);
    return handleResponse(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Network request failed');
  }
}

// Convenience methods for common HTTP methods
export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    }),

  put: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  patch: <T>(endpoint: string, data?: any, options?: RequestOptions) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};