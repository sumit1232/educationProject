let currentAccessToken: string | null = null;

export function setAccessToken(token: string | null) {
  currentAccessToken = token;
  if (token) {
    sessionStorage.setItem('sms_access_token', token);
  } else {
    sessionStorage.removeItem('sms_access_token');
  }
}

export function getStoredAccessToken(): string | null {
  if (currentAccessToken) return currentAccessToken;
  return sessionStorage.getItem('sms_access_token');
}

export async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; code?: string; [key: string]: any }> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getStoredAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Ensures HttpOnly cookies (access_token, refresh_token) are sent with every request
  };

  try {
    let response = await fetch(endpoint, config);

    // If access token expired, attempt automatic silent refresh
    if (response.status === 401 && endpoint !== '/api/auth/refresh' && endpoint !== '/api/auth/login') {
      try {
        const refreshRes = await fetch('/api/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          if (refreshData.accessToken) {
            setAccessToken(refreshData.accessToken);
            headers.set('Authorization', `Bearer ${refreshData.accessToken}`);
            // Retry initial request with new rotated token
            response = await fetch(endpoint, { ...options, headers, credentials: 'include' });
          }
        }
      } catch (refreshErr) {
        console.warn('Silent token refresh failed:', refreshErr);
      }
    }

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        success: false,
        message: json.message || `Request failed with status ${response.status}`,
        code: json.code || 'REQUEST_FAILED',
        ...json,
      };
    }

    return {
      success: true,
      ...json,
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Network error: could not connect to server.',
      code: 'NETWORK_ERROR',
    };
  }
}

export const api = {
  get: <T = any>(url: string, options?: RequestInit) => request<T>(url, { method: 'GET', ...options }),
  post: <T = any>(url: string, body?: any, options?: RequestInit) =>
    request<T>(url, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <T = any>(url: string, body?: any, options?: RequestInit) =>
    request<T>(url, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: <T = any>(url: string, options?: RequestInit) => request<T>(url, { method: 'DELETE', ...options }),
};
