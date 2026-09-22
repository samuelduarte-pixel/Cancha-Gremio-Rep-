import api from './client';

export interface FieldResponse {
    id: number;
    name: string;
    description: string;
    price_per_hour: number;
    surface_type: string;
    capacity: number;
    length_meters: number;
    width_meters: number;
    available_hour_start: string;
    available_hour_end: string;
    is_active: boolean;
    created_at: string;
}

export interface FieldCreate {
    name: string;
    description?: string;
    price_per_hour: number;
    surface_type?: string;
    capacity?: number;
    length_meters?: number;
    width_meters?: number;
    available_hour_start?: string;
    available_hour_end?: string;
}

export interface FieldUpdate {
    name?: string;
    description?: string;
    price_per_hour?: number;
    surface_type?: string;
    capacity?: number;
    length_meters?: number;
    width_meters?: number;
    available_hour_start?: string;
    available_hour_end?: string;
    is_active?: boolean;
}

export const fieldsApi = {
    getAll: () =>
        api.get<FieldResponse[]>('/api/v1/fields'),
    getAllAdmin: () =>
        api.get<FieldResponse[]>('/api/v1/fields/all'),
    getById: (id: number) =>
        api.get<FieldResponse>(`/api/v1/fields/${id}`),
    create: (data: FieldCreate) =>
        api.post<FieldResponse>('/api/v1/fields', data),
    update: (id: number, data: FieldUpdate) =>
        api.put<FieldResponse>(`/api/v1/fields/${id}`, data),
    delete: (id: number) =>
        api.delete(`/api/v1/fields/${id}`),
};
