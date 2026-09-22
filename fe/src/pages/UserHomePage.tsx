import { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { eventosApi } from '@/api/eventos';
import { Trophy, Users, Calendar, Clock, CreditCard, Building2, Smartphone, X, Plus, Minus, Loader } from 'lucide-react';

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

const paymentMethods = [
  { icon: <Smartphone size={22} />, name: 'Nequi', desc: '3101234567', color: '#5c2d91' },
  { icon: <Smartphone size={22} />, name: 'DaviPlata', desc: '3201234567', color: '#ed1c24' },
  { icon: <Building2 size={22} />, name: 'Transferencia Bancaria', desc: 'Bancolombia Cta Ahorros 123-456789-0', color: '#003e6b' },
  { icon: <CreditCard size={22} />, name: 'Tarjeta Débito/Crédito', desc: 'Visa, Mastercard, American Express', color: '#1a1f71' },
  { icon: <Building2 size={22} />, name: 'Efecty', desc: 'Código de referencia: CANCHA-123', color: '#002776' },
];

export default function UserHomePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal: inscripción equipo
  const [teamEvento, setTeamEvento] = useState<Evento | null>(null);
  const [teamForm, setTeamForm] = useState({
    teamName: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    players: ['', ''],
  });

  // Modal: inscripción individual
  const [indivEvento, setIndivEvento] = useState<Evento | null>(null);
  const [indivForm, setIndivForm] = useState({
    nombre: '',
    correo: '',
    telefono: '',
  });

  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await eventosApi.getAll();
        if (res.data && Array.isArray(res.data) && res.data.length > 0) {
          setEventos(res.data);
        } else {
          setEventos(initialEventos);
        }
      } catch {
        setEventos(initialEventos);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Team registration
  function openTeamInscribir(ev: Evento) {
    setTeamEvento(ev);
    setTeamForm({
      teamName: '',
      contactName: user?.nombre || '',
      contactEmail: user?.email || '',
      contactPhone: user?.telefono || '',
      players: ['', ''],
    });
  }

  function closeTeamModal() { setTeamEvento(null); }

  function addPlayer() {
    if (teamForm.players.length < 11) {
      setTeamForm(p => ({ ...p, players: [...p.players, ''] }));
    }
  }

  function removePlayer(idx: number) {
    if (teamForm.players.length > 2) {
      setTeamForm(p => ({ ...p, players: p.players.filter((_, i) => i !== idx) }));
    }
  }

  function playerChange(idx: number, value: string) {
    setTeamForm(p => ({
      ...p,
      players: p.players.map((pl, i) => (i === idx ? value : pl)),
    }));
  }

  async function handleTeamSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamEvento) return;
    if (!teamForm.teamName.trim()) {
      toast('Nombre del equipo requerido', 'error');
      return;
    }
    setRegistering(true);
    await new Promise(r => setTimeout(r, 800));
    try {
      setEventos(prev =>
        prev.map(ev =>
          ev.id === teamEvento.id
            ? { ...ev, cuposOcupados: ev.cuposOcupados + 1 }
            : ev
        )
      );
      toast(`Equipo "${teamForm.teamName}" inscrito en ${teamEvento.titulo}!`, 'success');
      closeTeamModal();
    } catch {
      toast('Error al inscribir equipo', 'error');
    } finally {
      setRegistering(false);
    }
  }

  // Individual registration
  function openIndivInscribir(ev: Evento) {
    setIndivEvento(ev);
    setIndivForm({
      nombre: user?.nombre || '',
      correo: user?.email || '',
      telefono: user?.telefono || '',
    });
  }

  function closeIndivModal() { setIndivEvento(null); }

  async function handleIndivSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!indivEvento) return;
    setRegistering(true);
    await new Promise(r => setTimeout(r, 800));
    try {
      setEventos(prev =>
        prev.map(ev =>
          ev.id === indivEvento.id
            ? { ...ev, cuposOcupados: ev.cuposOcupados + 1 }
            : ev
        )
      );
      toast(`Inscripción exitosa en ${indivEvento.titulo}!`, 'success');
      closeIndivModal();
    } catch {
      toast('Error al inscribir', 'error');
    } finally {
      setRegistering(false);
    }
  }

  const eventosDisponibles = eventos.filter(e => e.activo !== false);

  return (
    <Layout title="INICIO">
      {/* Welcome */}
      <div className="card" style={{
        padding: 28, marginBottom: 28,
        background: 'linear-gradient(135deg, #0d1f15 0%, #132a1c 100%)',
        border: '1px solid var(--clr-neon)',
      }}>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem', letterSpacing: '0.05em', color: 'var(--clr-neon)', marginBottom: 6 }}>
          BIENVENIDO, {user?.nombre?.toUpperCase() || 'USUARIO'}
        </h1>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.9rem' }}>
          Explora nuestros eventos, torneos y ligas. ¡Inscribe tu equipo o participa individualmente!
        </p>
      </div>

      {/* Eventos */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--clr-text)' }}>
            Eventos y Torneos Disponibles
          </h2>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60, color: 'var(--clr-text-muted)' }}>
            <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : eventosDisponibles.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 40, color: 'var(--clr-text-muted)' }}>
            No hay eventos disponibles por el momento
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
                      <span style={{ fontSize: '0.65rem', fontWeight: 600, color: '#4ade80', background: '#4ade8020', padding: '3px 8px', borderRadius: 99 }}>DISPONIBLE</span>
                    )}
                  </div>

                  <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{ev.titulo}</h3>
                  <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>{ev.descripcion}</p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', color: 'var(--clr-text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar size={13} /> {ev.fecha}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Clock size={13} /> {ev.horaInicio} - {ev.horaFin}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users size={13} /> {ocupados}/{cupos} cupos</div>
                  </div>

                  <div style={{ height: 4, background: 'var(--clr-surface)', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%',
                      width: `${Math.round((ocupados / cupos) * 100)}%`,
                      background: lleno ? '#ef4444' : (tipoColors[tipo] || 'var(--clr-neon)'),
                      borderRadius: 99,
                    }} />
                  </div>

                  <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--clr-neon)' }}>
                    {(ev.precio ?? 0) === 0 ? 'GRATIS' : `$${(ev.precio ?? 0).toLocaleString()}`}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => openTeamInscribir(ev)}
                      className="btn btn-primary"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '8px 10px' }}
                      disabled={lleno}
                    >
                      <Trophy size={13} /> Equipo
                    </button>
                    <button
                      onClick={() => openIndivInscribir(ev)}
                      className="btn btn-ghost"
                      style={{ flex: 1, justifyContent: 'center', fontSize: '0.75rem', padding: '8px 10px', border: '1px solid var(--clr-border)' }}
                      disabled={lleno}
                    >
                      <Users size={13} /> Individual
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Payment Methods */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 16, color: 'var(--clr-text)' }}>
          Métodos de Pago
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
          {paymentMethods.map((pm, i) => (
            <div key={i} className="card" style={{
              padding: 16, display: 'flex', alignItems: 'center', gap: 12,
              borderLeft: `3px solid ${pm.color}`,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 'var(--radius-sm)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: `${pm.color}15`, color: pm.color, flexShrink: 0,
              }}>
                {pm.icon}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{pm.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>{pm.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p style={{
          fontSize: '0.75rem', color: 'var(--clr-text-muted)', marginTop: 12,
          padding: '10px 14px', background: 'rgba(251,191,36,0.08)',
          borderRadius: 'var(--radius-sm)', border: '1px solid rgba(251,191,36,0.15)',
        }}>
          * Una vez realizado el pago, envía el comprobante por WhatsApp al 3001234567 para confirmar tu inscripción.
        </p>
      </div>

      {/* Quick links */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <a href="/eventos" className="btn btn-primary" style={{ textDecoration: 'none', gap: 8 }}>
          <Trophy size={16} /> Ver todos los eventos
        </a>
        <a href="/reservas" className="btn btn-ghost" style={{ textDecoration: 'none', gap: 8, border: '1px solid var(--clr-border)' }}>
          <Calendar size={16} /> Reservar cancha
        </a>
      </div>

      {/* Modal: Team inscription */}
      {teamEvento && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: 520, padding: 28,
            position: 'relative', border: '1px solid var(--clr-border)',
            maxHeight: '90vh', overflowY: 'auto',
          }}>
            <button onClick={closeTeamModal} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'transparent', border: 'none',
              color: 'var(--clr-text-muted)', cursor: 'pointer',
            }}>
              <X size={18} />
            </button>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.05em', marginBottom: 6, color: 'var(--clr-neon)' }}>
              INSCRIPCIÓN DE EQUIPO
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: 20 }}>
              Registra tu equipo para: <strong>{teamEvento.titulo}</strong>
            </p>

            <form onSubmit={handleTeamSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Nombre del Equipo *</label>
                <input value={teamForm.teamName} onChange={e => setTeamForm(p => ({ ...p, teamName: e.target.value }))} required placeholder="Ej: Los Crack FC" style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Nombre del Capitán *</label>
                  <input value={teamForm.contactName} onChange={e => setTeamForm(p => ({ ...p, contactName: e.target.value }))} required placeholder="Nombre" style={{ width: '100%' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Teléfono *</label>
                  <input value={teamForm.contactPhone} onChange={e => setTeamForm(p => ({ ...p, contactPhone: e.target.value }))} required placeholder="3001234567" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Correo Electrónico *</label>
                <input type="email" value={teamForm.contactEmail} onChange={e => setTeamForm(p => ({ ...p, contactEmail: e.target.value }))} required placeholder="capitan@email.com" style={{ width: '100%' }} />
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
                      <input value={player} onChange={e => playerChange(idx, e.target.value)} placeholder={`Jugador ${idx + 1}`} style={{ flex: 1 }} />
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
                background: 'var(--clr-surface)', padding: 14, borderRadius: 8,
                fontSize: '0.8rem', color: 'var(--clr-text-muted)',
                display: 'flex', flexDirection: 'column', gap: 6,
                border: '1px solid var(--clr-border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Evento:</span>
                  <span style={{ color: 'var(--clr-text)', fontWeight: 600 }}>{teamEvento.titulo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fecha:</span>
                  <span style={{ color: 'var(--clr-text)', fontWeight: 600 }}>{teamEvento.fecha}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Valor:</span>
                  <span style={{ color: 'var(--clr-neon)', fontWeight: 700 }}>
                    {(teamEvento.precio ?? 0) === 0 ? 'GRATIS' : `$${(teamEvento.precio ?? 0).toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={closeTeamModal} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button type="submit" disabled={registering} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {registering ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Inscribir equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Individual inscription */}
      {indivEvento && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div className="card" style={{
            width: '100%', maxWidth: 480, padding: 28,
            position: 'relative', border: '1px solid var(--clr-border)',
          }}>
            <button onClick={closeIndivModal} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'transparent', border: 'none',
              color: 'var(--clr-text-muted)', cursor: 'pointer',
            }}>
              <X size={18} />
            </button>

            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', letterSpacing: '0.05em', marginBottom: 6, color: 'var(--clr-neon)' }}>
              INSCRIPCIÓN INDIVIDUAL
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--clr-text-muted)', marginBottom: 20 }}>
              Registra tus datos para: <strong>{indivEvento.titulo}</strong>
            </p>

            <form onSubmit={handleIndivSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Nombre Completo *</label>
                <input value={indivForm.nombre} onChange={e => setIndivForm(p => ({ ...p, nombre: e.target.value }))} required placeholder="Tu nombre" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Correo Electrónico *</label>
                <input type="email" value={indivForm.correo} onChange={e => setIndivForm(p => ({ ...p, correo: e.target.value }))} required placeholder="tucorreo@email.com" style={{ width: '100%' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Teléfono *</label>
                <input value={indivForm.telefono} onChange={e => setIndivForm(p => ({ ...p, telefono: e.target.value }))} required placeholder="3001234567" style={{ width: '100%' }} />
              </div>

              <div style={{
                background: 'var(--clr-surface)', padding: 14, borderRadius: 8,
                fontSize: '0.8rem', color: 'var(--clr-text-muted)', marginTop: 6,
                display: 'flex', flexDirection: 'column', gap: 6,
                border: '1px solid var(--clr-border)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Evento:</span>
                  <span style={{ color: 'var(--clr-text)', fontWeight: 600 }}>{indivEvento.titulo}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Fecha:</span>
                  <span style={{ color: 'var(--clr-text)', fontWeight: 600 }}>{indivEvento.fecha}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Valor:</span>
                  <span style={{ color: 'var(--clr-neon)', fontWeight: 700 }}>
                    {(indivEvento.precio ?? 0) === 0 ? 'GRATIS' : `$${(indivEvento.precio ?? 0).toLocaleString()}`}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <button type="button" onClick={closeIndivModal} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
                <button type="submit" disabled={registering} className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
                  {registering ? <Loader size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Confirmar inscripción'}
                </button>
              </div>

              <p style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', textAlign: 'center', marginTop: 4 }}>
                * El pago se confirma vía WhatsApp con el comprobante
              </p>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
