// =============================================
// CANCHA GREMIO — Types & Interfaces
// =============================================

export type UserRole = 'admin' | 'cliente';

export interface User {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: UserRole;
  avatar?: string;
  createdAt: string;
}

export type ReservaEstado = 'pendiente' | 'confirmada' | 'cancelada' | 'completada';

export interface Reserva {
  id: string;
  clienteId: string;
  clienteNombre: string;
  clienteTelefono: string;
  fecha: string;         // ISO date string
  horaInicio: string;   // "HH:mm"
  horaFin: string;      // "HH:mm"
  cancha: number;       // 1 | 2 | 3...
  estado: ReservaEstado;
  totalPago: number;
  metodoPago?: MetodoPago;
  notas?: string;
  createdAt: string;
}

export type MetodoPago = 'efectivo' | 'transferencia' | 'nequi' | 'daviplata';

export interface Pago {
  id: string;
  reservaId: string;
  monto: number;
  metodo: MetodoPago;
  estado: 'pendiente' | 'completado' | 'fallido';
  comprobante?: string;
  fecha: string;
}

export type EventoTipo = 'torneo' | 'liga' | 'evento_especial' | 'mantenimiento';

export interface Evento {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: EventoTipo;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cupos: number;
  cuposOcupados: number;
  precio?: number;
  imagen?: string;
  activo: boolean;
  cancha_id?: number;
  cancha?: string;
  superficie?: string;
  capacidad?: number;
}

export interface Mantenimiento {
  id: string;
  cancha: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  descripcion: string;
  proveedor?: string;
}

export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'exito' | 'advertencia' | 'error';
  leida: boolean;
  fecha: string;
  link?: string;
}

export interface DashboardStats {
  totalReservasHoy: number;
  ingresosDia: number;
  ingresosMes: number;
  reservasPendientes: number;
  ocupacionPromedio: number;
  clientesRegistrados: number;
  proximosEventos: number;
}

export interface HorarioDisponible {
  hora: string;
  disponible: boolean;
  reservaId?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string[]>;
}
