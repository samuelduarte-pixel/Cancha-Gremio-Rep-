import api from './client';
import { Evento, DashboardStats, Mantenimiento } from '@/types';

// Payload esperado por el backend (schemas/event.py)
export interface EventoPayload {
  field_id?: number;
  name: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: string;
}

export const eventosApi = {
  getAll: () => api.get<Evento[]>('/eventos'),
  getById: (id: string) => api.get<Evento>(`/eventos/${id}`),
  create: (data: EventoPayload) => api.post<Evento>('/eventos', data),
  update: (id: string, data: Partial<EventoPayload>) => api.put<Evento>(`/eventos/${id}`, data),
  delete: (id: string) => api.delete(`/eventos/${id}`),
};

// =============================================
// Dashboard API
// =============================================

export const dashboardApi = {
  getStats: () => api.get<DashboardStats>('/dashboard/stats'),
  getReporteMensual: (year: number, month: number) =>
    api.get('/dashboard/reporte', { params: { year, month } }),
  exportReporte: (year: number, month: number) =>
    api.get('/dashboard/export', { params: { year, month }, responseType: 'blob' }),
};

// =============================================
// Mantenimiento API
// =============================================

export const mantenimientoApi = {
  getAll: () => api.get<Mantenimiento[]>('/mantenimiento'),
  create: (data: Omit<Mantenimiento, 'id'>) => api.post<Mantenimiento>('/mantenimiento', data),
  delete: (id: string) => api.delete(`/mantenimiento/${id}`),
};
