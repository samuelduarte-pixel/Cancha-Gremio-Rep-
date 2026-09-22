import api from './client';

export interface ReservationResponse {
  id: number;
  field_id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  start_time: string;
  end_time: string;
  total_price: number;
  status: string;
  payment_status: string;
}

export interface ReservationCreate {
  field_id: number;
  client_name: string;
  client_email: string;
  client_phone: string;
  start_time: string;
  end_time: string;
}

export interface ReservationUpdate {
  field_id?: number;
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  payment_status?: string;
}

export const reservasApi = {
  getAll: () =>
    api.get<ReservationResponse[]>('/api/v1/reservations'),
  getById: (id: number) =>
    api.get<ReservationResponse>(`/api/v1/reservations/${id}`),
  create: (data: ReservationCreate) =>
    api.post<ReservationResponse>('/api/v1/reservations', data),
  update: (id: number, data: ReservationUpdate) =>
    api.put<ReservationResponse>(`/api/v1/reservations/${id}`, data),
  cancel: (id: number) =>
    api.delete(`/api/v1/reservations/${id}`),
};
