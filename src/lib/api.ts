const API_BASE_URL = "http://localhost:3000";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
}

const getToken = (): string | null => {
  return localStorage.getItem("authToken");
};

const setToken = (token: string) => {
  localStorage.setItem("authToken", token);
};

const clearAuth = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
};

async function refreshToken(): Promise<boolean> {
  const token = getToken();
  if (!token) return false;
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) return false;
    const data = await res.json() as { token?: string; user?: unknown };
    if (data?.token) {
      setToken(data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export async function apiFetch<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const doFetch = async (): Promise<Response> => {
    return fetch(`${API_BASE_URL}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  };

  let res = await doFetch();
  if (res.status === 401 || res.status === 403) {
    const refreshed = await refreshToken();
    if (refreshed) {
      // retry with new token
      const retryHeaders = { ...headers, Authorization: `Bearer ${getToken()}` };
      res = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method || "GET",
        headers: retryHeaders,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });
    } else {
      clearAuth();
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const error = new Error((errorBody as { message?: string })?.message || "Request failed") as Error & { status?: number; body?: unknown };
    error.status = res.status;
    error.body = errorBody;
    throw error;
  }

  const jsonResponse = await res.json();
  return { data: jsonResponse } as T;
}

export const api = {
  get: <T = unknown>(path: string, headers?: Record<string, string>) =>
    apiFetch<{ data: T }>(path, { method: "GET", headers }),
  post: <T = unknown>(path: string, body?: unknown, headers?: Record<string, string>) =>
    apiFetch<{ data: T }>(path, { method: "POST", headers, body }),
  put: <T = unknown>(path: string, body?: unknown, headers?: Record<string, string>) =>
    apiFetch<{ data: T }>(path, { method: "PUT", headers, body }),
  delete: <T = unknown>(path: string, headers?: Record<string, string>) =>
    apiFetch<{ data: T }>(path, { method: "DELETE", headers }),
};
