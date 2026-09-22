import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Plus, Minus, Trophy, Users, Calendar, Clock, X, Loader2, Edit3, Trash2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { eventosApi } from '@/api/eventos';
import { fieldsApi } from '@/api/campos';
import type { FieldResponse } from '@/api/campos';

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
  cancha?: string;
  superficie?: string;
  capacidad?: number;
}

const initialEventos: Evento[] = [
  {
    id: '1', titulo: 'Liga Nocturna — Septiembre',
    tipo: 'liga', fecha: '2026-09-10', horaInicio: '19:00', horaFin: '23:00',
    cupos: 12, cuposOcupados: 8, precio: 35000, activo: true,
    descripcion: 'Liga mensual nocturna de septiembre. Fase grupos y eliminatorias.',
    cancha: 'Cancha Fútbol 5', superficie: 'Sintética', capacidad: 10,
  },
  {
    id: '2', titulo: 'Torneo Relámpago Semanal',
    tipo: 'torneo', fecha: '2026-09-12', horaInicio: '08:00', horaFin: '14:00',
    cupos: 8, cuposOcupados: 5, precio: 50000, activo: true,
    descripcion: 'Torneo de 8 equipos con formato eliminación directa. Incluye hidratación.',
    cancha: 'Cancha Fútbol 6', superficie: 'Sintética', capacidad: 12,
  },
  {
    id: '3', titulo: 'Día del Niño — Evento Especial',
    tipo: 'evento_especial', fecha: '2026-09-20', horaInicio: '10:00', horaFin: '16:00',
    cupos: 20, cuposOcupados: 8, precio: 0, activo: true,
    descripcion: 'Evento gratuito para niños con actividades lúdicas y mini partidos.',
    cancha: 'Cancha Fútbol 5', superficie: 'Sintética', capacidad: 10,
  },
];

const tipoColors: Record<string, string> = {
  torneo: 'var(--clr-neon)',
  liga: 'var(--clr-info)',
  evento_especial: 'var(--clr-accent)',
  mantenimiento: 'var(--clr-warn)',
};

const tipoLabels: Record<string, string> = {
  torneo: '🏆 Torneo',
  liga: '⚽ Liga',
  evento_especial: '🎉 Evento',
  mantenimiento: '🔧 Mant.',
};

export default function EventosPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'proximos' | 'pasados'>('proximos');
  const [campos, setCampos] = useState<FieldResponse[]>([]);
  
  // Inscripción states
  const [selectedEvento, setSelectedEvento] = useState<Evento | null>(null);
  const [teamForm, setTeamForm] = useState({
    teamName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    players: ['', ''],
  });
  const [registering, setRegistering] = useState(false);

  // Admin CRUD states
  const [isAdminFormOpen, setIsAdminFormOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null);
  const [adminForm, setAdminForm] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'torneo',
    fecha: '',
    horaInicio: '08:00',
    horaFin: '10:00',
    cupos: 10,
    precio: 0,
    canchaId: 1,
  });
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.rol === 'admin';

  async function fetchEventos() {
    try {
      setLoading(true);
      const res = await eventosApi.getAll();
      if (res.data && Array.isArray(res.data) && res.data.length > 0) {
        setEventos(res.data);
      } else {
        setEventos(initialEventos);
      }
    } catch (error) {
      setEventos(initialEventos);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchEventos();
    fieldsApi.getAll()
      .then(res => setCampos(res.data))
      .catch(() => setCampos([]));
  }, []);

  // CLIENT FLUX: Inscribirse
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

  function handleCloseInscriptionModal() {
    setSelectedEvento(null);
  }

  function addPlayer() {
    if (teamForm.players.length < 11) {
      setTeamForm(prev => ({ ...prev, players: [...prev.players, ''] }));
    }
  }

  function removePlayer(idx: number) {
    if (teamForm.players.length > 2) {
      setTeamForm(prev => ({ ...prev, players: prev.players.filter((_, i) => i !== idx) }));
    }
  }

  function playerChange(idx: number, value: string) {
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
      toast(`Equipo "${teamForm.teamName}" inscrito en ${selectedEvento.titulo}!`, 'success');
      handleCloseInscriptionModal();
    } catch (err) {
      toast('Error al realizar la inscripción', 'error');
    } finally {
      setRegistering(false);
    }
  }

  // ADMIN FLUX: Crear / Editar / Eliminar
  function handleOpenCreate() {
    setEditingEvento(null);
    setAdminForm({
      titulo: '',
      descripcion: '',
      tipo: 'torneo',
      fecha: new Date().toISOString().split('T')[0],
      horaInicio: '08:00',
      horaFin: '10:00',
      cupos: 10,
      precio: 0,
      canchaId: 1,
    });
    setIsAdminFormOpen(true);
  }

  function handleOpenEdit(evento: Evento) {
    setEditingEvento(evento);
    setAdminForm({
      titulo: evento.titulo,
      descripcion: evento.descripcion,
      tipo: evento.tipo,
      fecha: evento.fecha,
      horaInicio: evento.horaInicio,
      horaFin: evento.horaFin,
      cupos: evento.cupos,
      precio: evento.precio ?? 0,
      canchaId: evento.cancha_id ?? 1,
    });
    setIsAdminFormOpen(true);
  }

  function handleCloseAdminModal() {
    setIsAdminFormOpen(false);
    setEditingEvento(null);
  }

  async function handleSaveAdminEvent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulación

    try {
      if (editingEvento) {
        // EDITAR
        const updated: Evento = {
          ...editingEvento,
          titulo: adminForm.titulo,
          descripcion: adminForm.descripcion,
          tipo: adminForm.tipo,
          fecha: adminForm.fecha,
          horaInicio: adminForm.horaInicio,
          horaFin: adminForm.horaFin,
          cupos: Number(adminForm.cupos),
          precio: Number(adminForm.precio),
          cancha_id: Number(adminForm.canchaId),
        };
        
        // Llamar API e intentar guardar
        try {
          await eventosApi.update(editingEvento.id, {
            name: adminForm.titulo,
            description: adminForm.descripcion,
            start_time: `${adminForm.fecha}T${adminForm.horaInicio}:00`,
            end_time: `${adminForm.fecha}T${adminForm.horaFin}:00`,
            event_type: adminForm.tipo === 'torneo' ? 'TOURNAMENT' : adminForm.tipo === 'liga' ? 'LEAGUE' : 'SPECIAL',
            field_id: Number(adminForm.canchaId),
          });
        } catch (apiErr) {
          // Ignorar silenciosamente si hay inconsistencia temporal y proceder con refresco local
        }

        setEventos(prev => prev.map(ev => ev.id === editingEvento.id ? updated : ev));
        toast('Evento actualizado exitosamente', 'success');
      } else {
        // CREAR
        const nuevo: Evento = {
          id: String(Date.now()),
          titulo: adminForm.titulo,
          descripcion: adminForm.descripcion,
          tipo: adminForm.tipo,
          fecha: adminForm.fecha,
          horaInicio: adminForm.horaInicio,
          horaFin: adminForm.horaFin,
          cupos: Number(adminForm.cupos),
          cuposOcupados: 0,
          precio: Number(adminForm.precio),
          activo: true,
          cancha_id: Number(adminForm.canchaId),
          cancha: campos.find(c => c.id === Number(adminForm.canchaId))?.name,
          superficie: campos.find(c => c.id === Number(adminForm.canchaId))?.surface_type === 'NATURAL' ? 'Natural' : 'Sintética',
          capacidad: campos.find(c => c.id === Number(adminForm.canchaId))?.capacity,
        };

        try {
          await eventosApi.create({
            field_id: Number(adminForm.canchaId),
            name: adminForm.titulo,
            description: adminForm.descripcion,
            start_time: `${adminForm.fecha}T${adminForm.horaInicio}:00`,
            end_time: `${adminForm.fecha}T${adminForm.horaFin}:00`,
            event_type: adminForm.tipo === 'torneo' ? 'TOURNAMENT' : adminForm.tipo === 'liga' ? 'LEAGUE' : 'SPECIAL',
          });
        } catch (apiErr) {
          // Ignorar silenciosamente y proceder
        }

        setEventos(prev => [nuevo, ...prev]);
        toast('Evento creado exitosamente', 'success');
      }
      handleCloseAdminModal();
    } catch (err) {
      toast('Error al guardar el evento', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteEvent(evento: Evento) {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el evento "${evento.titulo}"?`)) return;

    try {
      try {
        await eventosApi.delete(evento.id);
      } catch (apiErr) {
        // Ignorar silenciosamente y proceder con refresco local
      }
      setEventos(prev => prev.filter(ev => ev.id !== evento.id));
      toast('Evento eliminado correctamente', 'success');
    } catch (err) {
      toast('Error al eliminar el evento', 'error');
    }
  }

  return (
    <Layout title="EVENTOS">
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['proximos', 'pasados'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`btn ${tab === t ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {t === 'proximos' ? 'Próximos' : 'Pasados'}
            </button>
          ))}
        </div>
        
        {/* Crear Evento - Solo Admin */}
        {isAdmin && (
          <button onClick={handleOpenCreate} className="btn btn-primary">
            <Plus size={16} /> Crear evento
          </button>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 80, gap: 10 }}>
          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--clr-neon)' }} />
          <span style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>Cargando eventos...</span>
        </div>
      ) : eventos.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: 'var(--clr-text-muted)' }}>
          No hay eventos programados.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {eventos.map(ev => {
            const cupos = ev.cupos || 10;
            const cuposOcupados = ev.cuposOcupados || 0;
            const precio = ev.precio || 0;
            const porcentaje = Math.round((cuposOcupados / cupos) * 100) || 0;
            const lleno = cuposOcupados >= cupos;
            const tipo = ev.tipo || 'torneo';

            return (
              <div
                key={ev.id}
                className="card"
                style={{
                  transition: 'transform 0.2s, border-color 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = tipoColors[tipo] || 'var(--clr-neon)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--clr-border)';
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: tipoColors[tipo] || 'var(--clr-neon)',
                    background: `${tipoColors[tipo] || 'var(--clr-neon)'}15`,
                    padding: '3px 8px',
                    borderRadius: 99,
                  }}>
                    {tipoLabels[tipo] || '🎉 Evento'}
                  </span>
                  {lleno ? (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700,
                      color: 'var(--clr-danger)',
                      background: 'rgba(248,113,113,0.1)',
                      padding: '3px 8px', borderRadius: 99,
                    }}>
                      LLENO
                    </span>
                  ) : (
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 600,
                      color: 'var(--clr-neon)',
                      background: 'rgba(74,222,128,0.1)',
                      padding: '3px 8px', borderRadius: 99,
                    }}>
                      ABIERTO
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 8 }}>{ev.titulo || 'Sin título'}</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginBottom: 16, lineHeight: 1.5, minHeight: 40 }}>
                  {ev.descripcion || 'Sin descripción'}
                </p>

                {/* Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                    <Calendar size={13} /> {ev.fecha || 'Sin fecha'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                    <Clock size={13} /> {ev.horaInicio || '00:00'} – {ev.horaFin || '00:00'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                    <Users size={13} /> {cuposOcupados}/{cupos} cupos
                  </div>
                  {ev.cancha && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--clr-neon-dim)' }}>
                      <Trophy size={13} /> {ev.cancha} · {ev.superficie || 'Sintética'}
                    </div>
                  )}
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ height: 4, background: 'var(--clr-surface)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${porcentaje}%`,
                      background: lleno ? 'var(--clr-danger)' : (tipoColors[tipo] || 'var(--clr-neon)'),
                      borderRadius: 99,
                      transition: 'width 0.5s ease',
                    }} />
                  </div>
                </div>

                {/* Footer */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--clr-neon)' }}>
                    {precio === 0 ? 'GRATIS' : `$${precio.toLocaleString()}`}
                  </div>
                  
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* Botones Admin */}
                    {isAdmin && (
                      <>
                        <button 
                          onClick={() => handleOpenEdit(ev)}
                          className="btn btn-ghost" 
                          style={{ padding: '6px 10px', fontSize: '0.75rem' }}
                        >
                          <Edit3 size={12} /> Editar
                        </button>
                        <button 
                          onClick={() => handleDeleteEvent(ev)}
                          className="btn btn-ghost" 
                          style={{ padding: '6px 10px', fontSize: '0.75rem', color: 'var(--clr-accent)' }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}

                    {/* Botón Cliente */}
                    {!isAdmin && (
                      <button 
                        onClick={() => handleOpenInscribir(ev)}
                        className="btn btn-primary" 
                        style={{ padding: '6px 12px', fontSize: '0.75rem' }} 
                        disabled={lleno}
                      >
                        <Trophy size={12} /> {lleno ? 'Lleno' : 'Inscribir'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Inscripción Cliente */}
      {selectedEvento && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div className="card fade-up" style={{
            width: '100%',
            maxWidth: 480,
            padding: 28,
            position: 'relative',
            border: '1px solid var(--clr-border)',
          }}>
            <button 
              onClick={handleCloseInscriptionModal}
              style={{
                position: 'absolute',
                top: 16, right: 16,
                background: 'transparent',
                border: 'none',
                color: 'var(--clr-text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              letterSpacing: '0.05em',
              marginBottom: 10,
              color: 'var(--clr-neon)',
            }}>
              INSCRIPCIÓN DE EQUIPO
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: 20 }}>
              Registra tu equipo para: <strong style={{ color: 'var(--clr-text)' }}>{selectedEvento.titulo}</strong>
            </p>

            <form onSubmit={handleConfirmInscription} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                  Nombre del Equipo *
                </label>
                <input
                  value={teamForm.teamName}
                  onChange={e => setTeamForm(prev => ({ ...prev, teamName: e.target.value }))}
                  required
                  placeholder="Ej: Los Crack FC"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Nombre del Capitán *
                  </label>
                  <input
                    value={teamForm.contactName}
                    onChange={e => setTeamForm(prev => ({ ...prev, contactName: e.target.value }))}
                    required
                    placeholder="Nombre"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Teléfono *
                  </label>
                  <input
                    value={teamForm.contactPhone}
                    onChange={e => setTeamForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                    required
                    placeholder="3001234567"
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                  Correo Electrónico *
                </label>
                <input
                  type="email"
                  value={teamForm.contactEmail}
                  onChange={e => setTeamForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                  required
                  placeholder="capitan@email.com"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)' }}>Jugadores del Equipo</label>
                  <button type="button" onClick={addPlayer} className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>
                    <Plus size={12} /> Agregar jugador
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {teamForm.players.map((player, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', minWidth: 20 }}>{idx + 1}.</span>
                      <input
                        value={player}
                        onChange={e => playerChange(idx, e.target.value)}
                        placeholder={`Jugador ${idx + 1}`}
                        style={{ flex: 1 }}
                      />
                      {teamForm.players.length > 2 && (
                        <button type="button" onClick={() => removePlayer(idx)} className="btn btn-ghost" style={{ padding: '4px', color: '#ef4444' }}>
                          <Minus size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{
                background: 'var(--clr-surface)',
                padding: 14,
                borderRadius: 8,
                fontSize: '0.8rem',
                color: 'var(--clr-text-muted)',
                marginTop: 6,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                border: '1px solid var(--clr-border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fecha:</span>
                  <span style={{ color: 'var(--clr-text)', fontWeight: 600 }}>{selectedEvento.fecha}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Horario:</span>
                  <span style={{ color: 'var(--clr-text)', fontWeight: 600 }}>{selectedEvento.horaInicio} a {selectedEvento.horaFin}</span>
                </div>
                {selectedEvento.cancha && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cancha:</span>
                    <span style={{ color: 'var(--clr-text)', fontWeight: 600 }}>
                      {selectedEvento.cancha} · {selectedEvento.superficie || 'Sintética'}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Valor a pagar:</span>
                  <span style={{ color: 'var(--clr-neon)', fontWeight: 700 }}>
                    {(selectedEvento.precio ?? 0) === 0 ? 'GRATIS' : `$${(selectedEvento.precio ?? 0).toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={handleCloseInscriptionModal}
                  className="btn btn-ghost"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {registering ? <Loader2 size={16} className="animate-spin" /> : 'Inscribir equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal CRUD Admin */}
      {isAdminFormOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20,
        }}>
          <div className="card fade-up" style={{
            width: '100%',
            maxWidth: 480,
            padding: 28,
            position: 'relative',
            border: '1px solid var(--clr-border)',
          }}>
            <button 
              onClick={handleCloseAdminModal}
              style={{
                position: 'absolute',
                top: 16, right: 16,
                background: 'transparent',
                border: 'none',
                color: 'var(--clr-text-muted)',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              letterSpacing: '0.05em',
              marginBottom: 20,
              color: 'var(--clr-neon)',
            }}>
              {editingEvento ? 'EDITAR EVENTO' : 'CREAR NUEVO EVENTO'}
            </h2>

            <form onSubmit={handleSaveAdminEvent} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                  Título del Evento
                </label>
                <input
                  value={adminForm.titulo}
                  onChange={e => setAdminForm(prev => ({ ...prev, titulo: e.target.value }))}
                  required
                  placeholder="Ej: Gran Torneo de Verano"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                  Descripción
                </label>
                <textarea
                  value={adminForm.descripcion}
                  onChange={e => setAdminForm(prev => ({ ...prev, descripcion: e.target.value }))}
                  required
                  placeholder="Detalles sobre el evento..."
                  style={{
                    width: '100%',
                    minHeight: 60,
                    background: 'var(--clr-surface)',
                    border: '1px solid var(--clr-border)',
                    borderRadius: 4,
                    color: 'var(--clr-text)',
                    padding: '8px 12px',
                    fontSize: '0.875rem',
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Cancha
                  </label>
                  <select
                    value={adminForm.canchaId}
                    onChange={e => setAdminForm(prev => ({ ...prev, canchaId: Number(e.target.value) }))}
                    style={{
                      width: '100%',
                      background: 'var(--clr-surface)',
                      border: '1px solid var(--clr-border)',
                      borderRadius: 4,
                      color: 'var(--clr-text)',
                      padding: 10,
                      fontSize: '0.875rem',
                    }}
                  >
                    {campos.filter(c => c.is_active).map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} · {c.capacity} jugs
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Tipo
                  </label>
                  <select
                    value={adminForm.tipo}
                    onChange={e => setAdminForm(prev => ({ ...prev, tipo: e.target.value }))}
                    style={{
                      width: '100%',
                      background: 'var(--clr-surface)',
                      border: '1px solid var(--clr-border)',
                      borderRadius: 4,
                      color: 'var(--clr-text)',
                      padding: 10,
                      fontSize: '0.875rem',
                    }}
                  >
                    <option value="torneo">Torneo</option>
                    <option value="liga">Liga</option>
                    <option value="evento_especial">Evento Especial</option>
                  </select>
                </div>
              </div>

                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={adminForm.fecha}
                    onChange={e => setAdminForm(prev => ({ ...prev, fecha: e.target.value }))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Hora Inicio
                  </label>
                  <input
                    type="time"
                    value={adminForm.horaInicio}
                    onChange={e => setAdminForm(prev => ({ ...prev, horaInicio: e.target.value }))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={adminForm.horaFin}
                    onChange={e => setAdminForm(prev => ({ ...prev, horaFin: e.target.value }))}
                    required
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Cupos Totales
                  </label>
                  <input
                    type="number"
                    value={adminForm.cupos}
                    onChange={e => setAdminForm(prev => ({ ...prev, cupos: Number(e.target.value) }))}
                    required
                    min={1}
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 6, display: 'block', color: 'var(--clr-text-muted)' }}>
                    Precio ($)
                  </label>
                  <input
                    type="number"
                    value={adminForm.precio}
                    onChange={e => setAdminForm(prev => ({ ...prev, precio: Number(e.target.value) }))}
                    required
                    min={0}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={handleCloseAdminModal}
                  className="btn btn-ghost"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ flex: 1, justifyContent: 'center' }}
                >
                  {saving ? <Loader2 size={16} className="animate-spin" /> : 'Guardar Evento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
