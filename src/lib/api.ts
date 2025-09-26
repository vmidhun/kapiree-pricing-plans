const API_BASE_URL = "http://localhost:3000";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
}

// Define Tenant interface
export interface Tenant {
  id: string;
  name: string;
  admin_user_id: string | null;
  created_at: string;
  updated_at: string;
}

// Define User interface for API responses
export interface User {
  id: string;
  username: string;
  email: string;
  credits: number;
  role: string;
  permissions: string[];
  company_id: string | null;
}

// Define API response interface for fetching multiple tenants
export interface TenantsResponse {
  tenants: Tenant[];
}

export interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: string;
  currency: string;
  interval: string;
  is_active?: boolean; // Added for soft delete
  created_at: string;
  updated_at: string;
}

export interface CreditPackDefinition {
  id: string;
  name: string;
  description: string;
  credits_amount: number;
  price: string;
  currency: string;
  validity_days: number | null;
  created_at: string;
  updated_at: string;
}

const getToken = (): string | null => {
  return localStorage.getItem("authToken");
};

const setToken = (token: string) => {
  localStorage.setItem("authToken", token);
};

// We need a way to trigger logout from AuthContext.
// This is a temporary workaround. In a real application, you might use a global event bus
// or pass the logout function down through context/props more explicitly.
let globalTriggerLogout: (() => void) | null = null;

export const setGlobalTriggerLogout = (func: () => void) => {
  globalTriggerLogout = func;
};

const clearAuth = () => {
  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  globalTriggerLogout?.(); // Trigger logout from AuthContext
};

async function refreshToken(): Promise<boolean> {
  const token = getToken();
  if (!token) {
    clearAuth(); // Clear auth if no token is found
    return false;
  }
  try {
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      clearAuth(); // Clear auth if refresh fails
      return false;
    }
    const data = await res.json() as { token?: string; user?: unknown };
    if (data?.token) {
      setToken(data.token);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      return true;
    }
    clearAuth(); // Clear auth if no token in refresh response
    return false;
  } catch (error) {
    console.error("Error refreshing token:", error);
    clearAuth(); // Clear auth on network error during refresh
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
      clearAuth(); // Logout if refresh failed
    }
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const error = new Error((errorBody as { message?: string })?.message || "Request failed") as Error & { status?: number; body?: unknown };
    error.status = res.status;
    error.body = errorBody;
    // If the error is still 401/403 after refresh attempt, or if it's a server error, trigger logout
    if (res.status === 401 || res.status === 403 || res.status >= 500) {
      clearAuth();
    }
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

  // Authentication related APIs
  forgotPassword: (email: string) =>
    api.post<{ message: string }>("/api/auth/forgot-password", { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post<{ message: string }>("/api/auth/reset-password", { token, newPassword }),

  // User Management APIs (Admin-only, with tenant-wise filtering)
  registerUser: (username: string, email: string, password: string, role_id: string, company_id: string) =>
    api.post<{ message: string; token: string; user: User }>("/api/auth/register", { username, email, password, role_id, company_id }),
  getUsers: () => api.get<User[]>("/api/auth/users"),
  getUserById: (userId: string) => api.get<User>(`/api/auth/users/${userId}`),
  updateUser: (userId: string, data: { username?: string; email?: string; roleId?: string }) =>
    api.put<{ message: string }>(`/api/auth/users/${userId}`, data),
  deleteUser: (userId: string) => api.delete<{ message: string }>(`/api/auth/users/${userId}`),
  assignRoleToUser: (userId: string, roleId: string) =>
    api.post<{ message: string }>(`/api/auth/users/${userId}/assign-role`, { roleId }),

  // Pricing Plans API
  getPricingPlans: () => api.get<PricingPlan[]>("/api/pricing-plans"),
  getPricingPlanById: (id: string) => api.get<PricingPlan>(`/api/pricing-plans/${id}`),
  createPricingPlan: (data: Omit<PricingPlan, "id" | "created_at" | "updated_at">) =>
    api.post<PricingPlan>("/api/pricing-plans", data),
  updatePricingPlan: (id: string, data: Partial<Omit<PricingPlan, "id" | "created_at" | "updated_at">>) =>
    api.put<PricingPlan>(`/api/pricing-plans/${id}`, data),
  deletePricingPlan: (id: string) => api.delete<void>(`/api/pricing-plans/${id}`),

  // Credit Packs API
  getCreditPacks: () => api.get<CreditPackDefinition[]>("/api/credit-packs"),
  getCreditPackById: (id: string) => api.get<CreditPackDefinition>(`/api/credit-packs/${id}`),
  createCreditPack: (data: Omit<CreditPackDefinition, "id" | "created_at" | "updated_at">) =>
    api.post<CreditPackDefinition>("/api/credit-packs", data),
  updateCreditPack: (id: string, data: Partial<Omit<CreditPackDefinition, "id" | "created_at" | "updated_at">>) =>
    api.put<CreditPackDefinition>(`/api/credit-packs/${id}`, data),
  deleteCreditPack: (id: string) => api.delete<void>(`/api/credit-packs/${id}`),
};
