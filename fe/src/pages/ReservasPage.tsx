import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { reservasApi, ReservationResponse } from '@/api/reservas';
import { fieldsApi, FieldResponse } from '@/api/campos';
import { eventosApi } from '@/api/eventos';
import { tarifasApi, TarifaCalculada } from '@/api/tarifas';
import { AlertCircle, Loader, Plus, Trophy, Users, Calendar, Clock, Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

type EventType = 'torneo' | 'liga' | 'evento_especial' | 'reserva';

interface Evento {
  id: string;
  titulo: string;
  tipo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cupos: number;
  cuposOcupados: number;
  precio?: number;
  activo: boolean;
  descripcion: string;
  cancha_id?: number;
}

const initialEventos: Evento[] = [
  {
    id: '1', titulo: 'Liga Nocturna — Septiembre',
    tipo: 'liga', fecha: '2026-09-10', horaInicio: '19:00', horaFin: '23:00',
    cupos: 12, cuposOcupados: 8, precio: 35000, activo: true,
    descripcion: 'Liga mensual nocturna de septiembre. Fase grupos y eliminatorias.',
  },
  {
    id: '2', titulo: 'Torneo Relámpago Semanal',
    tipo: 'torneo', fecha: '2026-09-12', horaInicio: '08:00', horaFin: '14:00',
    cupos: 8, cuposOcupados: 5, precio: 50000, activo: true,
    descripcion: 'Torneo de 8 equipos con formato eliminación directa.',
  },
  {
    id: '3', titulo: 'Día del Niño — Evento Especial',
    tipo: 'evento_especial', fecha: '2026-09-20', horaInicio: '10:00', horaFin: '16:00',
    cupos: 20, cuposOcupados: 8, precio: 0, activo: true,
    descripcion: 'Evento gratuito para niños con actividades lúdicas y mini partidos.',
  },
];

const tipoColors: Record<string, string> = {
  torneo: '#4ade80',
  liga: '#60a5fa',
  evento_especial: '#a78bfa',
  reserva: '#a0aec0',
};

const tipoLabels: Record<string, string> = {
  torneo: 'Torneo',
  liga: 'Liga',
  evento_especial: 'Evento Esp.',
  reserva: 'Reserva',
};

const tipoIcons: Record<string, React.ReactNode> = {
  torneo: <Trophy size={18} />,
  liga: <Calendar size={18} />,
  evento_especial: <Users size={18} />,
  reserva: <Clock size={18} />,
};

function detectEventType(res: ReservationResponse): EventType {
  const name = (res.client_name || '').toLowerCase();
  if (name.includes('torneo')) return 'torneo';
  if (name.includes('liga')) return 'liga';
  if (name.includes('evento') || name.includes('especial')) return 'evento_especial';
  return 'reserva';
}

export default function ReservasPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reservas, setReservas] = useState<ReservationResponse[]>([]);
  const [campos, setCampos] = useState<FieldResponse[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<EventType | 'all'>('all');

  // Create reservation modal
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  // Búsqueda, orden y paginación
  const [search, setSearch] = useState('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 8;

  const [newReserva, setNewReserva] = useState({
    client_name: user?.nombre || '',
    client_email: user?.email || '',
    client_phone: user?.telefono || '',
    field_id: 1,
    start_date: '',
    start_time: '08:00',
    end_time: '09:00',
    event_type: 'reserva' as EventType,
  });
  const [estimado, setEstimado] = useState<TarifaCalculada | null>(null);

  // Estimación en vivo del precio según la tarifa por franja horaria
  useEffect(() => {
    let alive = true;
    const startDate = newReserva.start_date;
    if (!startDate || !newReserva.start_time || !newReserva.end_time) {
      setEstimado(null);
      return;
    }
    const start = `${startDate}T${newReserva.start_time}:00`;
    const end = `${startDate}T${newReserva.end_time}:00`;
    tarifasApi.calcular({ start, end, field_id: newReserva.field_id })
      .then(res => { if (alive) setEstimado(res.data); })
      .catch(() => {
        if (!alive) return;
        const field = campos.find(c => c.id === newReserva.field_id);
        if (field) {
          const hours = Math.max((new Date(end).getTime() - new Date(start).getTime()) / 3600000, 1);
          setEstimado({
            tier: null, tier_name: null,
            price_per_hour: field.price_per_hour,
            hours: Math.round(hours * 100) / 100,
            total_price: field.price_per_hour * hours,
          });
        } else {
          setEstimado(null);
        }
      });
    return () => { alive = false; };
  }, [newReserva.start_date, newReserva.start_time, newReserva.end_time, newReserva.field_id, campos]);

  // Validación en tiempo real del horario
  const horarioError =
    newReserva.start_time && newReserva.end_time
      ? (newReserva.end_time <= newReserva.start_time ? 'La hora de fin debe ser posterior a la de inicio' : '')
      : '';

  // Validación de fecha: no puede ser pasada
  const todayStr = new Date().toISOString().split('T')[0];
  const fechaError = newReserva.start_date
    ? (newReserva.start_date < todayStr ? 'La fecha no puede ser anterior a hoy' : '')
    : '';

  // Validación de teléfono: 7–20 dígitos (y caracteres +, espacios ok)
  const phoneClean = newReserva.client_phone.replace(/[^0-9+]/g, '');
  const telefonoError = newReserva.client_phone
    ? (phoneClean.length < 7 || phoneClean.length > 20
        ? 'Ingresa un teléfono válido (mínimo 7 dígitos)'
        : '')
    : '';

  const formOk =
    newReserva.client_name.trim().length >= 3 &&
    newReserva.client_email.includes('@') &&
    phoneClean.length >= 7 &&
    newReserva.start_date >= todayStr &&
    newReserva.start_time &&
    newReserva.end_time &&
    newReserva.end_time > newReserva.start_time &&
    !fechaError &&
    !telefonoError;

  // --- Disponibilidad de canchas en el horario elegido ---
  const selectedSlot =
    newReserva.start_date && newReserva.start_time && newReserva.end_time
      ? {
          s: new Date(`${newReserva.start_date}T${newReserva.start_time}:00`),
          e: new Date(`${newReserva.start_date}T${newReserva.end_time}:00`),
        }
      : null;

  function overlaps(a: Date, b: Date): boolean {
    if (!selectedSlot) return false;
    return a < selectedSlot.e && b > selectedSlot.s;
  }

  function getConflict(field: FieldResponse): { ocupado: boolean; motivo: string } {
    if (!selectedSlot || !!horarioError || !!fechaError) {
      return { ocupado: false, motivo: '' };
    }
    const byReserva = reservas.find(r =>
      r.field_id === field.id &&
      r.status !== 'cancelled' &&
      overlaps(new Date(r.start_time), new Date(r.end_time))
    );
    if (byReserva) {
      const ini = new Date(byReserva.start_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      const fin = new Date(byReserva.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      return { ocupado: true, motivo: `Reserva de ${byReserva.client_name} (${ini} - ${fin})` };
    }
    const byEvento = eventos.find(ev =>
      Number(ev.cancha_id) === field.id &&
      ev.fecha === newReserva.start_date &&
      overlaps(
        new Date(`${ev.fecha}T${ev.horaInicio}:00`),
        new Date(`${ev.fecha}T${ev.horaFin}:00`)
      )
    );
    if (byEvento) {
      return { ocupado: true, motivo: `Ocupada por: ${byEvento.titulo}` };
    }
    return { ocupado: false, motivo: '' };
  }

  const selectedField = campos.find(c => c.id === newReserva.field_id);
  const selectedConflict = selectedField ? getConflict(selectedField) : { ocupado: false, motivo: '' };
  const canchasDisponibles = campos.filter(c => c.is_active && !getConflict(c).ocupado);

  // Si la cancha seleccionada queda ocupada al cambiar fecha/hora, elegir la primera libre
  useEffect(() => {
    if (selectedSlot && selectedConflict.ocupado && canchasDisponibles.length > 0) {
      setNewReserva(prev => ({ ...prev, field_id: canchasDisponibles[0].id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlot?.s?.getTime(), selectedSlot?.e?.getTime()]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [reservasRes, camposRes] = await Promise.all([
          reservasApi.getAll(),
          fieldsApi.getAll(),
        ]);
        setReservas(reservasRes.data || []);
        setCampos(camposRes.data || []);

        try {
          const eventosRes = await eventosApi.getAll();
          if (eventosRes.data && Array.isArray(eventosRes.data) && eventosRes.data.length > 0) {
            setEventos(eventosRes.data);
          } else {
            setEventos(initialEventos);
          }
        } catch {
          setEventos(initialEventos);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const typeCounts: Record<string, number> = {
    torneo: eventos.filter(e => e.tipo === 'torneo').length,
    liga: eventos.filter(e => e.tipo === 'liga').length,
    evento_especial: eventos.filter(e => e.tipo === 'evento_especial').length,
    reserva: reservas.filter(r => detectEventType(r) === 'reserva').length,
  };

  const filteredReservas = activeType === 'all'
    ? reservas
    : reservas.filter(r => detectEventType(r) === activeType);

  const searchedReservas = filteredReservas.filter(r =>
    `${r.client_name} ${r.client_email} ${r.client_phone}`.toLowerCase().includes(search.toLowerCase())
  );

  const sortedReservas = [...searchedReservas].sort((a, b) => {
    const t = new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    return sortDir === 'asc' ? t : -t;
  });

  const totalPages = Math.max(1, Math.ceil(sortedReservas.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageReservas = sortedReservas.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const mapStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      confirmed: '#4ade80',
      pending: '#facc15',
      cancelled: '#ef4444',
    };
    return colors[status] || '#a0aec0';
  };

  const mapStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      confirmed: 'Confirmada',
      pending: 'Pendiente',
      cancelled: 'Cancelada',
    };
    return labels[status] || status;
  };

  async function handleCreateReserva(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    try {
      const startDateTime = `${newReserva.start_date}T${newReserva.start_time}:00`;
      const endDateTime = `${newReserva.start_date}T${newReserva.end_time}:00`;
      await reservasApi.create({
        field_id: newReserva.field_id,
        client_name: newReserva.client_name,
        client_email: newReserva.client_email,
        client_phone: newReserva.client_phone,
        start_time: startDateTime,
        end_time: endDateTime,
      });
      toast('Reserva creada exitosamente', 'success');
      setShowCreate(false);
      const res = await reservasApi.getAll();
      setReservas(res.data || []);
    } catch (err: any) {
      toast(err?.response?.data?.detail || 'Error al crear la reserva', 'error');
    } finally {
      setCreating(false);
    }
  }

  const typeCards: { key: EventType | 'all'; label: string }[] = [
    { key: 'all', label: 'Todas' },
    { key: 'torneo', label: 'Torneos' },
    { key: 'liga', label: 'Ligas' },
    { key: 'evento_especial', label: 'Eventos' },
    { key: 'reserva', label: 'Reservas' },
  ];

  return (
    <Layout title="RESERVAS">
      {/* Type overview cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
        {typeCards.map(tc => {
          const isActive = activeType === tc.key;
          const count = tc.key === 'all' ? reservas.length : (typeCounts[tc.key] || 0);
          const color = tc.key === 'all' ? 'var(--clr-text)' : (tipoColors[tc.key] || '#a0aec0');
          return (
            <button
              key={tc.key}
              onClick={() => setActiveType(tc.key)}
              className="card"
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                textAlign: 'left',
                border: isActive ? `2px solid ${color}` : '1px solid var(--clr-border)',
                background: isActive ? `${color}08` : 'var(--clr-bg-card)',
                transition: 'all 0.15s',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ color }}>{tc.key !== 'all' && tipoIcons[tc.key]}</span>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--clr-text-muted)' }}>{tc.label}</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color }}>{count}</div>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', maxWidth: 260 }}>
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por cliente, correo o teléfono..."
              style={{ paddingLeft: 32, fontSize: '0.8rem' }}
            />
            <Search size={14} style={{
              position: 'absolute', left: 10, top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--clr-text-dim)',
            }} />
          </div>
          <button
            onClick={() => { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); setPage(1); }}
            className="btn btn-ghost"
            style={{ padding: '8px 12px', fontSize: '0.75rem' }}
            title="Ordenar por fecha de inicio"
          >
            <ArrowUpDown size={14} />
            Fecha {sortDir === 'asc' ? '↑' : '↓'}
          </button>
          <div style={{ fontSize: '0.9rem', color: 'var(--clr-text-muted)' }}>
            {sortedReservas.length} resultado(s)
            {activeType !== 'all' && ` · ${tipoLabels[activeType] || activeType}`}
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ padding: '8px 16px' }}>
          <Plus size={16} /> Nueva reserva
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: 'var(--clr-text-muted)' }}>
          <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
          Cargando reservas...
        </div>
      ) : error ? (
        <div className="card" style={{ background: 'rgba(239,68,68,0.1)', borderLeft: '4px solid #ef4444', padding: 20, display: 'flex', alignItems: 'center', gap: 12, color: '#ef4444' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : filteredReservas.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
          <p style={{ fontSize: '1.1rem', marginBottom: 8 }}>No hay reservas de este tipo</p>
          <p style={{ fontSize: '0.9rem' }}>Las reservas aparecerán aquí cuando se creen</p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead style={{ background: 'var(--clr-bg-alt)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--clr-text-muted)' }}>ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--clr-text-muted)' }}>Tipo</th>
                  <th
                    onClick={() => { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); setPage(1); }}
                    style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--clr-text-muted)', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                    title="Ordenar por fecha"
                  >
                    Inicio {sortDir === 'asc' ? '↑' : '↓'}
                  </th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--clr-text-muted)' }}>Fin</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--clr-text-muted)' }}>Precio</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--clr-text-muted)' }}>Estado</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--clr-text-muted)' }}>Cliente</th>
                </tr>
              </thead>
              <tbody>
                {pageReservas.map((res) => {
                  const tipo = detectEventType(res);
                  return (
                    <tr key={res.id} style={{ borderTop: '1px solid var(--clr-border)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--clr-bg-alt)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '12px 16px', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{res.id}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ display: 'inline-block', padding: '3px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600, color: tipoColors[tipo], background: `${tipoColors[tipo]}15` }}>
                          {tipoLabels[tipo]}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                        {new Date(res.start_time).toLocaleString('es-ES', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.85rem' }}>
                        {new Date(res.end_time).toLocaleString('es-ES', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: '#4ade80' }}>
                        ${res.total_price.toLocaleString('es-ES')}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontWeight: 600, background: mapStatusColor(res.status) + '20', color: mapStatusColor(res.status) }}>
                          {mapStatusLabel(res.status)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                        {res.client_name}
                        <div style={{ fontSize: '0.7rem' }}>{res.client_phone}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--clr-border)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                Mostrando {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sortedReservas.length)} de {sortedReservas.length}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                  className="btn btn-ghost"
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                >
                  <ChevronLeft size={14} /> Anterior
                </button>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', padding: '6px 12px',
                  fontSize: '0.8rem', background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--clr-border)', fontFamily: 'var(--font-mono)',
                }}>
                  {safePage} / {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                  className="btn btn-ghost"
                  style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                >
                  Siguiente <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create reservation modal */}
      {showCreate && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div className="card fade-up" style={{ width: '100%', maxWidth: 480, padding: 28, position: 'relative' }}>
            <button onClick={() => setShowCreate(false)} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--clr-text-muted)', cursor: 'pointer' }}>✕</button>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.05em', marginBottom: 20, color: 'var(--clr-neon)' }}>
              NUEVA RESERVA
            </h2>

            <form onSubmit={handleCreateReserva} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="req" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Tipo de reserva</label>
                <select
                  value={newReserva.event_type}
                  onChange={e => setNewReserva(prev => ({ ...prev, event_type: e.target.value as EventType }))}
                  style={{ width: '100%', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 4, color: 'var(--clr-text)', padding: 10 }}
                >
                  <option value="reserva">Reserva normal</option>
                  <option value="torneo">Torneo</option>
                  <option value="liga">Liga</option>
                  <option value="evento_especial">Evento Especial</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="req" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Fecha</label>
                  <input type="date" value={newReserva.start_date} onChange={e => setNewReserva(prev => ({ ...prev, start_date: e.target.value }))} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="req" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Hora inicio</label>
                  <input type="time" value={newReserva.start_time} onChange={e => setNewReserva(prev => ({ ...prev, start_time: e.target.value }))} required style={{ width: '100%' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="req" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Hora fin</label>
                  <input type="time" value={newReserva.end_time} onChange={e => setNewReserva(prev => ({ ...prev, end_time: e.target.value }))} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="req" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Tipo de reserva</label>
                  <select
                    value={newReserva.event_type}
                    onChange={e => setNewReserva(prev => ({ ...prev, event_type: e.target.value as EventType }))}
                    style={{ width: '100%', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 4, color: 'var(--clr-text)', padding: 10 }}
                  >
                    <option value="reserva">Reserva normal</option>
                    <option value="torneo">Torneo</option>
                    <option value="liga">Liga</option>
                    <option value="evento_especial">Evento Especial</option>
                  </select>
                </div>
              </div>

              {/* Selección de cancha con disponibilidad visible */}
              <div>
                <label className="req" style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                  Disponibilidad de canchas {selectedSlot ? `para ${newReserva.start_date} ${newReserva.start_time} - ${newReserva.end_time}` : ''}
                </label>
                {!selectedSlot ? (
                  <div style={{ fontSize: '0.8rem', color: 'var(--clr-text-dim)', padding: '8px 12px', background: 'var(--clr-surface)', borderRadius: 6, border: '1px dashed var(--clr-border)' }}>
                    Selecciona la fecha y el horario para ver qué canchas están disponibles.
                  </div>
                ) : (
                  <>
                    {campos.filter(c => c.is_active).length === 0 ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--clr-danger)', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 6, border: '1px solid rgba(239,68,68,0.2)' }}>
                        No hay canchas registradas.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {campos.filter(c => c.is_active).map(c => {
                          const conf = getConflict(c);
                          const selected = c.id === newReserva.field_id;
                          const libre = !conf.ocupado;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => { if (libre) setNewReserva(prev => ({ ...prev, field_id: c.id })); }}
                              disabled={!libre}
                              style={{
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                gap: 8, padding: '10px 12px',
                                border: selected ? '2px solid var(--clr-neon)' : `1px solid ${libre ? 'var(--clr-border)' : 'rgba(239,68,68,0.35)'}`,
                                borderRadius: 8,
                                background: selected ? 'rgba(74,222,128,0.08)' : libre ? 'var(--clr-surface)' : 'rgba(239,68,68,0.05)',
                                color: 'var(--clr-text)',
                                cursor: libre ? 'pointer' : 'not-allowed',
                                opacity: libre ? 1 : 0.75,
                                textAlign: 'left',
                                width: '100%',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{c.name}</span>
                                <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-dim)' }}>
                                  ${c.price_per_hour.toLocaleString('es-CO')}/h · {c.capacity} jug
                                </span>
                              </div>
                              <span style={{
                                fontSize: '0.68rem', fontWeight: 700, padding: '3px 8px', borderRadius: 99,
                                background: libre ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)',
                                color: libre ? '#4ade80' : '#ef4444',
                                textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap',
                              }}>
                                {libre ? '✓ Disponible' : '✗ Ocupada'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {selectedConflict.ocupado && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--clr-danger)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 10px', marginTop: 6 }}>
                        ⚠ La cancha seleccionada no está disponible: {selectedConflict.motivo}. Elige otra cancha libre.
                      </div>
                    )}
                    {!selectedConflict.ocupado && selectedSlot && canchasDisponibles.length === 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--clr-danger)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 10px', marginTop: 6 }}>
                        No hay canchas disponibles en ese horario. Cambia la fecha o la hora.
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label className="req" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Hora inicio</label>
                  <input type="time" value={newReserva.start_time} onChange={e => setNewReserva(prev => ({ ...prev, start_time: e.target.value }))} required style={{ width: '100%' }} />
                </div>
                <div>
                  <label className="req" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Hora fin</label>
                  <input type="time" value={newReserva.end_time} onChange={e => setNewReserva(prev => ({ ...prev, end_time: e.target.value }))} required style={{ width: '100%' }} />
                </div>
              </div>
              {horarioError && (
                <div style={{ fontSize: '0.75rem', color: 'var(--clr-danger)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 10px' }}>
                  {horarioError}
                </div>
              )}
              {fechaError && (
                <div style={{ fontSize: '0.75rem', color: 'var(--clr-danger)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 10px' }}>
                  {fechaError}
                </div>
              )}
              {telefonoError && (
                <div style={{ fontSize: '0.75rem', color: 'var(--clr-danger)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '8px 10px' }}>
                  {telefonoError}
                </div>
              )}

              {estimado && (
                <div style={{
                  fontSize: '0.8rem', padding: '10px 12px', borderRadius: 8,
                  background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.18)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {campos.find(c => c.id === newReserva.field_id) && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: 'var(--clr-text-muted)' }}>
                        {'📍 ' + campos.find(c => c.id === newReserva.field_id)?.name}
                      </span>
                      <span style={{ color: 'var(--clr-text-dim)', fontSize: '0.7rem' }}>
                        {campos.find(c => c.id === newReserva.field_id)?.surface_type || 'Sintética'} · {campos.find(c => c.id === newReserva.field_id)?.capacity} jugadores
                      </span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ color: 'var(--clr-text-muted)' }}>
                      {estimado.tier ? estimado.tier.name : 'Tarifa base de la cancha'}
                    </span>
                    <span style={{ color: 'var(--clr-neon)', fontWeight: 700 }}>
                      ${Math.round(estimado.price_per_hour).toLocaleString('es-CO')}/hora
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--clr-text-dim)' }}>{estimado.hours} hora(s)</span>
                    <span style={{ color: '#fff', fontWeight: 700 }}>
                      Total: ${Math.round(estimado.total_price).toLocaleString('es-CO')}
                    </span>
                  </div>
                  {estimado.tier && (
                    <div style={{ color: 'var(--clr-text-dim)', fontSize: '0.7rem', marginTop: 4 }}>
                      Rango informado: ${estimado.tier.price_min.toLocaleString('es-CO')} – ${estimado.tier.price_max.toLocaleString('es-CO')} COP
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="req" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Nombre</label>
                <input value={newReserva.client_name} onChange={e => setNewReserva(prev => ({ ...prev, client_name: e.target.value }))} required placeholder="Nombre del cliente" style={{ width: '100%' }} />
              </div>
              <div>
                <label className="req" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Email</label>
                <input type="email" value={newReserva.client_email} onChange={e => setNewReserva(prev => ({ ...prev, client_email: e.target.value }))} required placeholder="cliente@email.com" style={{ width: '100%' }} />
              </div>
              <div>
                <label className="req" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Teléfono</label>
                <input value={newReserva.client_phone} onChange={e => setNewReserva(prev => ({ ...prev, client_phone: e.target.value }))} required placeholder="3001234567" style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button type="submit" disabled={creating || !!horarioError || !!fechaError || !!telefonoError || !formOk || selectedConflict.ocupado || (!!selectedSlot && canchasDisponibles.length === 0)} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {creating ? <Loader size={16} /> : 'Crear reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
