import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// =============================================
// API Client — apunta al backend de FastAPI
// Maneja tokens de acceso + refresh automático
// =============================================

const BASE_URL = import.meta.env.VITE_API_URL || '';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

let refreshing: Promise<string | null> | null = null;

interface AuthResponse {
  access_token?: string;
  token?: string;
  refresh_token?: string;
}

// Solicita un par nuevo de tokens usando el refresh token guardado
async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = localStorage.getItem('cg_refresh');
  if (!refreshToken) return null;

  const config: InternalAxiosRequestConfig = {
    url: '/api/v1/auth/refresh',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' } as InternalAxiosRequestConfig['headers'],
    data: { refresh_token: refreshToken },
  };

  const { data } = await api.request<AuthResponse>(config);
  const nextAccess = data.access_token || data.token;
  if (!nextAccess) return null;

  localStorage.setItem('cg_token', nextAccess);
  if (data.refresh_token) localStorage.setItem('cg_refresh', data.refresh_token);
  return nextAccess;
}

// Request interceptor — adjunta el access token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('cg_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — en 401 intenta renovar con refresh y reintenta la petición
api.interceptors.response.use(
  res => res,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;

    // Evita reintentar en /refresh, /login y requests ya reintentados
    const skip =
      !original ||
      original._retried ||
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/login') ||
      original.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !skip) {
      try {
        if (!refreshing) {
          refreshing = refreshAccessToken().finally(() => { refreshing = null; });
        }
        const newToken = await refreshing;
        if (!newToken) throw new Error('refresh fallido');

        original._retried = true;
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch {
        // No se pudo renovar: cerrar sesión
        localStorage.removeItem('cg_token');
        localStorage.removeItem('cg_refresh');
        localStorage.removeItem('cg_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;