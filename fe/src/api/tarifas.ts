import api from './client';

export interface Tarifa {
  id: number;
  name: string;
  day_type: 'weekday' | 'saturday' | 'sunday_holiday';
  start_time: string;
  end_time: string;
  price_min: number;
  price_max: number;
  price: number;
  notes: string | null;
  is_active: boolean;
}

export interface TarifaCalculada {
  tier: Tarifa | null;
  tier_name: string | null;
  price_per_hour: number;
  hours: number;
  total_price: number;
}

export const tarifasApi = {
  getAll: () =>
    api.get<Tarifa[]>('/api/v1/tarifas'),
  calcular: (params: { start: string; end?: string; field_id?: number }) =>
    api.get<TarifaCalculada>('/api/v1/tarifas/calcular', { params }),
};