import api from './client';

// =============================================
// Auth API — campos adaptados al BE
// BE usa: correo, contraseña, nombre_rol, id_rol
// =============================================

export const authApi = {

  // POST /api/auth/login
  login: (email: string, password: string) =>
    api.post<{ token: string; usuario: { id_usuario: number; nombre: string; correo: string; id_rol: number; nombre_rol: string } }>(
      '/api/auth/login',
      { correo: email, password: password }   // BE espera correo/contraseña
    ),

  // POST /api/auth/registro  ← BE usa /registro no /register
  register: (data: {
    nombre: string;
    apellido?: string;
    correo: string;
    password: string;
    telefono?: string;
    direccion?: string;
    fecha_nacimiento?: string;
    id_tipo_documento?: number;
  }) => api.post<{
    id_usuario: number;
    nombre: string;
    correo: string;
    mensaje: string;
    confirmation_url?: string;
  }>(
    '/api/auth/registro',
    data
  ),

  // GET /api/auth/perfil  ← BE usa /perfil no /me
  me: () =>
    api.get<{
      id_usuario: number; nombre: string; correo: string;
      telefono: string; direccion: string; nombre_rol: string;
    }>('/api/auth/perfil'),

  // PUT /api/auth/perfil
  updatePerfil: (data: {
    nombre?: string; telefono?: string; direccion?: string;
    fecha_nacimiento?: string; id_tipo_documento?: number;
  }) => api.put('/api/auth/perfil', data),
  // POST /api/auth/forgot-password
  forgotPassword: (correo: string) =>
    api.post('/api/auth/forgot-password', { correo }),

  // POST /api/auth/reset-password/:token — BE espera 'password'
  resetPassword: (token: string, password: string) =>
    api.post(`/api/auth/reset-password/${token}`, { password }),

  // GET /api/v1/auth/confirmar/:token — confirma el correo del registro
  confirmar: (token: string) =>
    api.get(`/api/v1/auth/confirmar/${token}`),

  // POST /api/v1/auth/refresh — renueva el par de tokens
  refresh: (refreshToken: string) =>
    api.post<{ access_token: string; token: string; refresh_token: string }>(
      '/api/v1/auth/refresh',
      { refresh_token: refreshToken }
    ),

  // POST /api/v1/auth/logout — revoca los tokens en el backend
  logout: (refreshToken?: string) =>
    api.post('/api/v1/auth/logout', undefined, {
      headers: { 'refresh_token': refreshToken || '' },
    }),

  // POST /api/v1/auth/logout-all — cierra la sesión en todos los dispositivos
  logoutAll: () =>
    api.post<{ mensaje: string }>('/api/v1/auth/logout-all'),

  // POST /api/v1/auth/eliminar-cuenta — solicita eliminación (envía enlace)
  solicitarEliminarCuenta: (password: string) =>
    api.post<{ mensaje: string; confirmation_url?: string }>(
      '/api/v1/auth/eliminar-cuenta',
      { password }
    ),

  // GET /api/v1/auth/eliminar-cuenta/confirmar/:token
  confirmarEliminarCuenta: (token: string) =>
    api.get(`/api/v1/auth/eliminar-cuenta/confirmar/${token}`),
};

// =============================================
// Users/Clientes API — usa /api/admin/clientes
// =============================================

export interface AdminCliente {
  id_usuario: number;
  nombre: string;
  correo: string;
  telefono: string;
  estado: string;
  fecha_registro: string;
  total_reservas: number;
  impuntualidades: number;
  motivo_bloqueo: string | null;
}

export const usersApi = {

  // GET /api/admin/clientes  ← solo admin
  getAll: () =>
    api.get<AdminCliente[]>('/api/admin/clientes'),

  // PUT /api/admin/clientes/:id/estado
  toggleEstado: (id: number, estado: 'activo' | 'inactivo') =>
    api.put(`/api/admin/clientes/${id}/estado`, { estado }),

  // PUT /api/admin/clientes/:id/impuntualidad
  marcarImpuntualidad: (id: number) =>
    api.put<{ message: string; impuntualidades: number; bloqueado: boolean }>(`/api/admin/clientes/${id}/impuntualidad`),

  // PUT /api/admin/clientes/:id/impuntualidad/reset
  resetImpuntualidad: (id: number) =>
    api.put<{ message: string; impuntualidades: number }>(`/api/admin/clientes/${id}/impuntualidad/reset`),

  // PUT /api/admin/clientes/:id
  update: (id: number, data: { nombre: string; correo: string; telefono: string }) =>
    api.put(`/api/admin/clientes/${id}`, data),
};