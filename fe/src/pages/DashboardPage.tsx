import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { reservasApi, ReservationResponse, ReservationUpdate } from '@/api/reservas';
import { fieldsApi, FieldResponse } from '@/api/campos';
import { eventosApi } from '@/api/eventos';
import { AlertCircle, Loader, Check, X, Trophy, Calendar, Clock, Users, Plus, Minus, Edit3, Trash2 } from 'lucide-react';

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
    descripcion: 'Torneo de 8 equipos con formato eliminación directa. Incluye hidratación.',
  },
  {
    id: '3', titulo: 'Día del Niño — Evento Especial',
    tipo: 'evento_especial', fecha: '2026-09-20', horaInicio: '10:00', horaFin: '16:00',
    cupos: 20, cuposOcupados: 8, precio: 0, activo: true,
    descripcion: 'Evento gratuito para niños con actividades lúdicas y mini partidos.',
  },
];

const tipoColors: Record<string, string> = {
  torneo: 'var(--clr-neon)',
  liga: 'var(--clr-info)',
  evento_especial: 'var(--clr-accent)',
};

const tipoLabels: Record<string, string> = {
  torneo: 'Torneo',
  liga: 'Liga',
  evento_especial: 'Evento',
};

function getHoursInRange(start: string | null | undefined, end: string | null | undefined): string[] {
  const hours: string[] = [];
  if (!start || !end) return hours;
  const s = parseInt(start.split(':')[0]);
  const e = parseInt(end.split(':')[0]);
  for (let i = s; i < e; i++) {
    hours.push(`${i.toString().padStart(2, '0')}:00`);
  }
  return hours;
}

function isSlotReserved(slot: string, dateStr: string, fieldId: number, reservations: ReservationResponse[]): boolean {
  const slotStart = new Date(`${dateStr}T${slot}`);
  const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
  return reservations.some(r => {
    if (r.field_id !== fieldId) return false;
    const rStart = new Date(r.start_time);
    const rEnd = new Date(r.end_time);
    return rStart < slotEnd && rEnd > slotStart;
  });
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [reservas, setReservas] = useState<ReservationResponse[]>([]);
  const [campos, setCampos] = useState<FieldResponse[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));

  // Team inscription
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [teamForm, setTeamForm] = useState({
    teamName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    players: ['', ''],
  });
  const [registering, setRegistering] = useState(false);

  // Reservation CRUD (admin)
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<ReservationResponse | null>(null);
  const [savingReservation, setSavingReservation] = useState(false);
  const [reservationForm, setReservationForm] = useState({
    field_id: 1,
    client_name: '',
    client_email: '',
    client_phone: '',
    fecha: new Date().toISOString().split('T')[0],
    horaInicio: '08:00',
    horaFin: '09:00',
    status: 'confirmed',
    payment_status: 'pending',
  });

  async function fetchData() {
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
  }

  async function loadReservas() {
    try {
      const res = await reservasApi.getAll();
      setReservas(res.data || []);
    } catch {
      // ignore
    }
  }

  useEffect(() => { fetchData(); }, []);

  const activeCampos = campos.filter(c => c.is_active);

  // --- Reservation CRUD admin ---
  function openCreateReservation() {
    setEditingReservation(null);
    setReservationForm({
      field_id: activeCampos[0]?.id || 1,
      client_name: '',
      client_email: '',
      client_phone: '',
      fecha: new Date().toISOString().split('T')[0],
      horaInicio: '08:00',
      horaFin: '09:00',
      status: 'confirmed',
      payment_status: 'pending',
    });
    setReservationModalOpen(true);
  }

  function openEditReservation(r: ReservationResponse) {
    setEditingReservation(r);
    const start = new Date(r.start_time);
    const end = new Date(r.end_time);
    setReservationForm({
      field_id: r.field_id,
      client_name: r.client_name,
      client_email: r.client_email,
      client_phone: r.client_phone,
      fecha: start.toISOString().split('T')[0],
      horaInicio: start.toTimeString().slice(0, 5),
      horaFin: end.toTimeString().slice(0, 5),
      status: r.status,
      payment_status: r.payment_status,
    });
    setReservationModalOpen(true);
  }

  function closeReservationModal() {
    setReservationModalOpen(false);
    setEditingReservation(null);
  }

  const horarioInvalido =
    (reservationForm.horaFin <= reservationForm.horaInicio) ||
    (reservationForm.fecha < formatDate(new Date()) && !editingReservation);

  async function handleSaveReservation(e: React.FormEvent) {
    e.preventDefault();
    if (horarioInvalido) {
      toast('Verifica el horario: la hora de fin debe ser posterior a la de inicio y la fecha no puede ser pasada', 'error');
      return;
    }
    setSavingReservation(true);
    const payload: ReservationUpdate & { client_name: string; client_email: string; client_phone: string; field_id: number; start_time: string; end_time: string } = {
      field_id: Number(reservationForm.field_id),
      client_name: reservationForm.client_name,
      client_email: reservationForm.client_email,
      client_phone: reservationForm.client_phone,
      start_time: `${reservationForm.fecha}T${reservationForm.horaInicio}:00`,
      end_time: `${reservationForm.fecha}T${reservationForm.horaFin}:00`,
      status: reservationForm.status,
      payment_status: reservationForm.payment_status,
    };
    try {
      if (editingReservation) {
        await reservasApi.update(editingReservation.id, payload);
        toast('Reserva actualizada correctamente', 'success');
      } else {
        await reservasApi.create(payload);
        toast('Reserva creada correctamente', 'success');
      }
      closeReservationModal();
      await loadReservas();
    } catch (err: any) {
      toast(err?.response?.data?.detail || 'Error al guardar la reserva', 'error');
    } finally {
      setSavingReservation(false);
    }
  }

  async function handleDeleteReservation(r: ReservationResponse) {
    if (!window.confirm(`¿Cancelar la reserva de ${r.client_name} (${r.client_email})?`)) return;
    try {
      await reservasApi.cancel(r.id);
      toast('Reserva cancelada correctamente', 'success');
      await loadReservas();
    } catch (err: any) {
      toast(err?.response?.data?.detail || 'Error al cancelar la reserva', 'error');
    }
  }

  function handleOpenInscribir(evento: Evento) {
    setSelectedEvento(evento);
    setTeamForm({
      teamName: '',
      contactName: user?.nombre || '',
      contactEmail: user?.email || '',
      contactPhone: user?.telefono || '',
      players: ['', ''],
    });
  }

  function handleCloseModal() {
    setSelectedEvento(null);
  }

  function handleAddPlayer() {
    if (teamForm.players.length < 11) {
      setTeamForm(prev => ({ ...prev, players: [...prev.players, ''] }));
    }
  }

  function handleRemovePlayer(idx: number) {
    if (teamForm.players.length > 2) {
      setTeamForm(prev => ({ ...prev, players: prev.players.filter((_, i) => i !== idx) }));
    }
  }

  function handlePlayerChange(idx: number, value: string) {
    setTeamForm(prev => ({
      ...prev,
      players: prev.players.map((p, i) => (i === idx ? value : p)),
    }));
  }

  async function handleConfirmInscription(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEvento) return;

    if (!teamForm.teamName.trim()) {
      toast('Debes ingresar el nombre del equipo', 'error');
      return;
    }

    setRegistering(true);
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      setEventos(prev =>
        prev.map(ev =>
          ev.id === selectedEvento.id
            ? { ...ev, cuposOcupados: ev.cuposOcupados + 1 }
            : ev
        )
      );
      toast(`¡Equipo "${teamForm.teamName}" inscrito en ${selectedEvento.titulo}!`, 'success');
      handleCloseModal();
    } catch {
      toast('Error al realizar la inscripción', 'error');
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return (
      <Layout title="INICIO">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, color: 'var(--clr-text-muted)' }}>
          <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
          Cargando datos...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="INICIO">
        <div className="card" style={{ background: 'rgba(239,68,68,0.1)', borderLeft: '4px solid #ef4444', padding: 20, display: 'flex', alignItems: 'center', gap: 12, color: '#ef4444' }}>
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </Layout>
    );
  }

  const eventosDisponibles = eventos.filter(e => e.activo !== false);

  return (
    <Layout title="INICIO">
      {/* Sección: Canchas y Horarios */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--clr-text)' }}>
            Canchas y Horarios Disponibles
          </h2>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', background: 'var(--clr-surface)', color: 'var(--clr-text)', fontSize: '0.85rem' }}
          />
        </div>

        {activeCampos.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
            <p>No hay canchas disponibles</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {activeCampos.map(campo => {
              const allHours = getHoursInRange(campo.available_hour_start, campo.available_hour_end);
              return (
                <div key={campo.id} className="card" style={{ padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 12 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.2rem' }}>{campo.name}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontWeight: 600, color: '#60a5fa', fontSize: '1rem' }}>${campo.price_per_hour.toLocaleString('es-ES')}/h</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 2 }}>{campo.surface_type} · {campo.capacity} jug</div>
                    </div>
                  </div>

                  <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 10 }}>
                    Horario: {campo.available_hour_start} - {campo.available_hour_end}
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {allHours.map(hour => {
                      const reserved = isSlotReserved(hour, selectedDate, campo.id, reservas);
                      return (
                        <div
                          key={hour}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            padding: '6px 10px',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: reserved ? '#ef444420' : '#4ade8020',
                            color: reserved ? '#ef4444' : '#4ade80',
                            border: `1px solid ${reserved ? '#ef444430' : '#4ade8030'}`,
                          }}
                        >
                          {reserved ? <X size={12} /> : <Check size={12} />}
                          {hour}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sección: Eventos */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, color: 'var(--clr-text)' }}>
          Eventos y Torneos
        </h2>

        {eventosDisponibles.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
            <p>No hay eventos disponibles</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {eventosDisponibles.map(ev => {
              const cupos = ev.cupos || 10;
              const ocupados = ev.cuposOcupados || 0;
              const lleno = ocupados >= cupos;
              const tipo = ev.tipo || 'torneo';

              return (
                <div key={ev.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: 600, padding: '3px 8px', borderRadius: 99,
                      color: tipoColors[tipo] || 'var(--clr-neon)',
                      background: `${tipoColors[tipo] || 'var(--clr-neon)'}15`,
                    }}>
                      {tipoLabels[tipo] || 'Evento'}
                    </span>
                    {lleno ? (
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, color: '#ef4444', background: '#ef444420', padding: '3px 8px', borderRadius: 99 }}>LLENO</span>
                    ) : (
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#4ade80', background: '#4ade8020', padding: '3px 8px', borderRadius: 99 }}>ABIERTO</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{ev.titulo}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>{ev.descripcion}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={13} /> {ev.fecha}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={13} /> {ev.horaInicio} - {ev.horaFin}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={13} /> {ocupados}/{cupos} equipos</div>
                  </div>

                  <div style={{ marginTop: 8 }}>
                    <div style={{ height: 4, background: 'var(--clr-surface)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.round((ocupados / cupos) * 100)}%`,
                        background: lleno ? '#ef4444' : (tipoColors[tipo] || 'var(--clr-neon)'),
                        borderRadius: 99,
                      }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--clr-neon)' }}>
                      {(ev.precio ?? 0) === 0 ? 'GRATIS' : `$${(ev.precio ?? 0).toLocaleString()}`}
                    </div>
                    <button
                      onClick={() => handleOpenInscribir(ev)}
                      className="btn btn-primary"
                      style={{ padding: '6px 14px', fontSize: '0.8rem' }}
                      disabled={lleno}
                    >
                      <Trophy size={14} /> {lleno ? 'Lleno' : 'Inscribir equipo'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sección: Estado de Pagos */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 0, color: 'var(--clr-text)' }}>
            Estado de Pagos — Reservas
          </h2>
          <button onClick={openCreateReservation} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            <Plus size={14} /> Nueva Reserva
          </button>
        </div>

        {reservas.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
            <p>No hay reservas registradas</p>
          </div>
        ) : (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--clr-border)' }}>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 600, color: 'var(--clr-text-muted)' }}>Cliente</th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 600, color: 'var(--clr-text-muted)' }}>Cancha</th>
                  <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 600, color: 'var(--clr-text-muted)' }}>Fecha</th>
                  <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 600, color: 'var(--clr-text-muted)' }}>Total</th>
                  <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 600, color: 'var(--clr-text-muted)' }}>Estado</th>
                  <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: 600, color: 'var(--clr-text-muted)' }}>Pago</th>
                  <th style={{ textAlign: 'right', padding: '12px 14px', fontWeight: 600, color: 'var(--clr-text-muted)' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map(r => {
                  const campo = campos.find(c => c.id === r.field_id);
                  const fecha = new Date(r.start_time).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                  const total = r.total_price || 0;

                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--clr-border)' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 600 }}>{r.client_name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>{r.client_phone}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--clr-text-muted)' }}>
                        {campo?.name || `Cancha ${r.field_id}`}
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--clr-text-muted)' }}>
                        {fecha}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}>
                        ${total.toLocaleString('es-ES')}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 99,
                          fontSize: '0.65rem', fontWeight: 700,
                          background: r.status === 'confirmed' ? '#4ade8020' : '#ef444420',
                          color: r.status === 'confirmed' ? '#4ade80' : '#ef4444',
                        }}>
                          {r.status === 'confirmed' ? 'Confirmada' : r.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <PaymentBadge status={r.payment_status} />
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center', flexWrap: 'wrap' }}>
                          <PaymentActions reservation={r} onUpdate={() => loadReservas()} />
                          <button
                            onClick={() => openEditReservation(r)}
                            title="Modificar reserva"
                            style={{
                              padding: '4px 8px', fontSize: '0.65rem', fontWeight: 600,
                              border: '1px solid #60a5fa40', borderRadius: 'var(--radius-sm)',
                              background: '#60a5fa10', color: '#60a5fa', cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            <Edit3 size={11} /> Editar
                          </button>
                          <button
                            onClick={() => handleDeleteReservation(r)}
                            title="Cancelar reserva"
                            disabled={r.status === 'cancelled'}
                            style={{
                              padding: '4px 8px', fontSize: '0.65rem', fontWeight: 600,
                              border: '1px solid #ef444440', borderRadius: 'var(--radius-sm)',
                              background: '#ef444410', color: '#ef4444', cursor: r.status === 'cancelled' ? 'not-allowed' : 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                              opacity: r.status === 'cancelled' ? 0.4 : 1,
                            }}
                          >
                            <Trash2 size={11} /> {r.status === 'cancelled' ? 'Cancelada' : 'Cancelar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          </div>
        )}
      </div>

      {/* Sección: Lista de Canchas */}
      <div>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, color: 'var(--clr-text)' }}>
          Todas las Canchas
        </h2>

        {campos.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
            <p>No hay canchas registradas</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {campos.map(campo => (
              <div key={campo.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12, opacity: campo.is_active ? 1 : 0.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{campo.name}</div>
                  </div>
                  <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 'var(--radius-sm)', fontSize: '0.7rem', fontWeight: 600, background: campo.is_active ? '#4ade8020' : '#ef444420', color: campo.is_active ? '#4ade80' : '#ef4444' }}>
                    {campo.is_active ? 'Activa' : 'Inactiva'}
                  </span>
                </div>

                {campo.description && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>{campo.description}</p>
                )}

                <div style={{ paddingTop: 12, borderTop: '1px solid var(--clr-border)', display: 'grid', gap: 6, fontSize: '0.85rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--clr-text-muted)' }}>Superficie:</span><span>{campo.surface_type}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--clr-text-muted)' }}>Dimensiones:</span><span>{campo.length_meters}m x {campo.width_meters}m</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--clr-text-muted)' }}>Capacidad:</span><span>{campo.capacity} jugadores</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--clr-text-muted)' }}>Horario:</span><span>{campo.available_hour_start} - {campo.available_hour_end}</span>
                  </div>
                </div>

                <div style={{ paddingTop: 12, borderTop: '1px solid var(--clr-border)', fontSize: '1.1rem', fontWeight: 600, color: '#60a5fa', textAlign: 'right' }}>
                  ${campo.price_per_hour.toLocaleString('es-ES')}/hora
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Inscripción de equipo */}
      {selectedEvento && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div className="card fade-up" style={{
            width: '100%', maxWidth: 520, padding: 28,
            position: 'relative', border: '1px solid var(--clr-border)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <button onClick={handleCloseModal} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'transparent', border: 'none',
              color: 'var(--clr-text-muted)', cursor: 'pointer',
            }}>
              ✕
            </button>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.05em', marginBottom: 6, color: 'var(--clr-neon)' }}>
              INSCRIPCIÓN DE EQUIPO
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: 20 }}>
              Registra tu equipo para: <strong style={{ color: 'var(--clr-text)' }}>{selectedEvento.titulo}</strong>
            </p>

            <form onSubmit={handleConfirmInscription} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                  Nombre del Equipo *
                </label>
                <input
                  value={teamForm.teamName}
                  onChange={e => setTeamForm(prev => ({ ...prev, teamName: e.target.value }))}
                  required placeholder="Ej: Los Crack FC"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Nombre del Capitán *
                  </label>
                  <input
                    value={teamForm.contactName}
                    onChange={e => setTeamForm(prev => ({ ...prev, contactName: e.target.value }))}
                    required placeholder="Nombre"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Teléfono *
                  </label>
                  <input
                    value={teamForm.contactPhone}
                    onChange={e => setTeamForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    required placeholder="3001234567"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={teamForm.contactEmail}
                  onChange={e => setTeamForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                  required placeholder="capitan@email.com"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>
                    Jugadores del Equipo
                  </label>
                  <button type="button" onClick={handleAddPlayer} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
                    <Plus size={12} /> Agregar jugador
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {teamForm.players.map((player, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', minWidth: 20 }}>{idx + 1}.</span>
                      <input
                        value={player}
                        onChange={e => handlePlayerChange(idx, e.target.value)}
                        placeholder={`Jugador ${idx + 1}`}
                        style={{ flex: 1 }}
                      />
                      {teamForm.players.length > 2 && (
                        <button type="button" onClick={() => handleRemovePlayer(idx)} className="btn btn-ghost" style={{ padding: '4px', color: '#ef4444' }}>
                          <Minus size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: 'var(--clr-surface)', padding: 14, borderRadius: 8,
                fontSize: '0.8rem', color: 'var(--clr-text-muted)',
                display: 'flex', flexDirection: 'column', gap: 6,
                border: '1px solid var(--clr-border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Evento:</span>
                  <span style={{ color: 'var(--clr-text)', fontWeight: 600 }}>{selectedEvento.titulo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fecha:</span>
                  <span style={{ color: 'var(--clr-text)', fontWeight: 600 }}>{selectedEvento.fecha}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Valor:</span>
                  <span style={{ color: 'var(--clr-neon)', fontWeight: 700 }}>
                    {(selectedEvento.precio ?? 0) === 0 ? 'GRATIS' : `$${(selectedEvento.precio ?? 0).toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={handleCloseModal} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={registering} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {registering ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Inscribir equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Crear / Editar Reserva (admin) */}
      {reservationModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div className="card fade-up" style={{
            width: '100%', maxWidth: 560, padding: 28,
            position: 'relative', border: '1px solid var(--clr-border)',
            maxHeight: '92vh', overflowY: 'auto',
          }}>
            <button onClick={closeReservationModal} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'transparent', border: 'none',
              color: 'var(--clr-text-muted)', cursor: 'pointer',
            }}>
              ✕
            </button>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', letterSpacing: '0.05em', marginBottom: 6, color: 'var(--clr-neon)' }}>
              {editingReservation ? 'MODIFICAR RESERVA' : 'NUEVA RESERVA'}
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: 20 }}>
              {editingReservation ? `Reserva #${editingReservation.id} — puedes cambiar cualquier dato` : 'Registra una reserva para cualquier cancha y horario'}
            </p>

            <form onSubmit={handleSaveReservation} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                  Cancha *
                </label>
                <select
                  value={reservationForm.field_id}
                  onChange={e => setReservationForm(prev => ({ ...prev, field_id: Number(e.target.value) }))}
                  style={{ width: '100%', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 4, color: 'var(--clr-text)', padding: 10, fontSize: '0.875rem' }}
                >
                  {activeCampos.map(c => (
                    <option key={c.id} value={c.id}>{c.name} · ${c.price_per_hour.toLocaleString('es-ES')}/h · {c.capacity} jug</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Nombre del Cliente *
                  </label>
                  <input
                    value={reservationForm.client_name}
                    onChange={e => setReservationForm(prev => ({ ...prev, client_name: e.target.value }))}
                    required placeholder="Nombre y apellido"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Teléfono *
                  </label>
                  <input
                    value={reservationForm.client_phone}
                    onChange={e => setReservationForm(prev => ({ ...prev, client_phone: e.target.value }))}
                    required placeholder="3001234567"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                  Correo del Cliente *
                </label>
                <input
                  type="email"
                  value={reservationForm.client_email}
                  onChange={e => setReservationForm(prev => ({ ...prev, client_email: e.target.value }))}
                  required placeholder="cliente@email.com"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Fecha *
                  </label>
                  <input
                    type="date"
                    value={reservationForm.fecha}
                    onChange={e => setReservationForm(prev => ({ ...prev, fecha: e.target.value }))}
                    required style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    value={reservationForm.horaInicio}
                    onChange={e => setReservationForm(prev => ({ ...prev, horaInicio: e.target.value }))}
                    required style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Hora Fin *
                  </label>
                  <input
                    type="time"
                    value={reservationForm.horaFin}
                    onChange={e => setReservationForm(prev => ({ ...prev, horaFin: e.target.value }))}
                    required style={{ width: '100%' }}
                  />
                </div>
              </div>

              {horarioInvalido && (
                <div style={{ fontSize: '0.75rem', color: '#ef4444', background: '#ef444412', border: '1px solid #ef444430', borderRadius: 6, padding: '8px 10px' }}>
                  La hora de fin debe ser posterior a la de inicio y la fecha no puede ser anterior a hoy.
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Estado
                  </label>
                  <select
                    value={reservationForm.status}
                    onChange={e => setReservationForm(prev => ({ ...prev, status: e.target.value }))}
                    style={{ width: '100%', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 4, color: 'var(--clr-text)', padding: 10, fontSize: '0.875rem' }}
                  >
                    <option value="confirmed">Confirmada</option>
                    <option value="pending">Pendiente</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Estado de Pago
                  </label>
                  <select
                    value={reservationForm.payment_status}
                    onChange={e => setReservationForm(prev => ({ ...prev, payment_status: e.target.value }))}
                    style={{ width: '100%', background: 'var(--clr-surface)', border: '1px solid var(--clr-border)', borderRadius: 4, color: 'var(--clr-text)', padding: 10, fontSize: '0.875rem' }}
                  >
                    <option value="pending">Pendiente</option>
                    <option value="paid">Pagado</option>
                    <option value="refunded">Reembolsado</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={closeReservationModal} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={savingReservation} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {savingReservation ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : (editingReservation ? 'Guardar Cambios' : 'Crear Reserva')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, { bg: string; color: string; label: string }> = {
    paid: { bg: '#4ade8020', color: '#4ade80', label: 'Pagado' },
    pending: { bg: '#fbbf2420', color: '#fbbf24', label: 'Pendiente' },
    cancelled: { bg: '#ef444420', color: '#ef4444', label: 'Cancelado' },
    refunded: { bg: '#a78bfa20', color: '#a78bfa', label: 'Reembolsado' },
  };
  const s = styles[status] || { bg: '#6b728020', color: '#6b7280', label: status };
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700, background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function PaymentActions({ reservation, onUpdate }: { reservation: ReservationResponse; onUpdate: () => void }) {
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function updatePayment(status: string) {
    setLoadingAction(status);
    try {
      await reservasApi.update(reservation.id, { payment_status: status } as ReservationUpdate);
      toast(`Pago marcado como "${status}"`, 'success');
      onUpdate();
    } catch {
      toast('Error al actualizar pago', 'error');
    } finally {
      setLoadingAction(null);
    }
  }

  const actions: { status: string; label: string; color: string }[] = [];
  if (reservation.payment_status !== 'paid') actions.push({ status: 'paid', label: 'Pagado', color: '#4ade80' });
  if (reservation.payment_status !== 'pending') actions.push({ status: 'pending', label: 'Pendiente', color: '#fbbf24' });
  if (reservation.payment_status !== 'cancelled') actions.push({ status: 'cancelled', label: 'Cancelar', color: '#ef4444' });

  return (
    <div style={{ display: 'flex', gap: 4, justifyContent: 'flex-end' }}>
      {actions.map(a => (
        <button
          key={a.status}
          onClick={() => updatePayment(a.status)}
          disabled={loadingAction === a.status}
          style={{
            padding: '3px 8px', fontSize: '0.65rem', fontWeight: 600,
            border: `1px solid ${a.color}40`, borderRadius: 'var(--radius-sm)',
            background: `${a.color}10`, color: a.color, cursor: 'pointer',
          }}
        >
          {loadingAction === a.status ? <Loader size={10} style={{ animation: 'spin 0.8s linear infinite' }} /> : a.label}
        </button>
      ))}
    </div>
  );
}
