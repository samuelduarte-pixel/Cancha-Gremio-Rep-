import { useState } from 'react';
import Layout from '@/components/Layout';
import { ChevronLeft, ChevronRight, Plus, Clock, User } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

// =============================================
// Reservas Page
// =============================================

const HORAS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00'];

const mockReservas = [
  { id: '1', fecha: new Date(), horaInicio: '08:00', horaFin: '09:00', cancha: 1, cliente: 'Carlos M.', estado: 'confirmada' },
  { id: '2', fecha: new Date(), horaInicio: '10:00', horaFin: '11:00', cancha: 1, cliente: 'Laura T.',   estado: 'pendiente' },
  { id: '3', fecha: new Date(), horaInicio: '14:00', horaFin: '15:00', cancha: 2, cliente: 'Pedro R.',   estado: 'confirmada' },
  { id: '4', fecha: new Date(), horaInicio: '16:00', horaFin: '17:00', cancha: 1, cliente: 'Ana S.',     estado: 'confirmada' },
];

const estadoColors: Record<string, string> = {
  confirmada: 'var(--clr-neon)',
  pendiente: 'var(--clr-warn)',
  cancelada: 'var(--clr-danger)',
};

export default function ReservasPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedCancha, setSelectedCancha] = useState(1);
  const [view, setView] = useState<'calendario' | 'lista'>('calendario');

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const reservasDelDia = mockReservas.filter(r => isSameDay(r.fecha, selectedDate));

  return (
    <Layout title="RESERVAS">
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['calendario', 'lista'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`btn ${view === v ? 'btn-primary' : 'btn-ghost'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {v === 'calendario' ? '📅' : '📋'} {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {[1, 2, 3].map(c => (
            <button
              key={c}
              onClick={() => setSelectedCancha(c)}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                fontWeight: 600,
                border: selectedCancha === c ? '1px solid var(--clr-neon)' : '1px solid var(--clr-border)',
                background: selectedCancha === c ? 'rgba(74,222,128,0.1)' : 'transparent',
                color: selectedCancha === c ? 'var(--clr-neon)' : 'var(--clr-text-muted)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Cancha {c}
            </button>
          ))}
          <button className="btn btn-primary" style={{ gap: 6 }}>
            <Plus size={16} /> Nueva reserva
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Mini Calendar */}
        <div className="card" style={{ alignSelf: 'start' }}>
          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              style={{ color: 'var(--clr-text-muted)', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em', fontSize: '1.1rem' }}>
              {format(currentMonth, 'MMMM yyyy', { locale: es }).toUpperCase()}
            </span>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              style={{ color: 'var(--clr-text-muted)', padding: 4, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Day names */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 8 }}>
            {['D','L','M','M','J','V','S'].map((d, i) => (
              <div key={i} style={{
                textAlign: 'center',
                fontSize: '0.65rem',
                fontWeight: 600,
                color: 'var(--clr-text-dim)',
                padding: '4px 0',
                fontFamily: 'var(--font-mono)',
              }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {/* Empty cells for first week */}
            {Array.from({ length: days[0].getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map(day => {
              const hasReservas = mockReservas.some(r => isSameDay(r.fecha, day));
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDay = isToday(day);
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  style={{
                    aspectRatio: '1',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontWeight: isSelected || isTodayDay ? 700 : 400,
                    background: isSelected
                      ? 'var(--clr-neon)'
                      : isTodayDay
                      ? 'rgba(74,222,128,0.1)'
                      : 'transparent',
                    color: isSelected
                      ? '#060a07'
                      : isTodayDay
                      ? 'var(--clr-neon)'
                      : isSameMonth(day, currentMonth)
                      ? 'var(--clr-text)'
                      : 'var(--clr-text-dim)',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    border: 'none',
                    gap: 2,
                  }}
                >
                  {day.getDate()}
                  {hasReservas && !isSelected && (
                    <div style={{
                      width: 4, height: 4,
                      borderRadius: '50%',
                      background: 'var(--clr-neon)',
                      position: 'absolute',
                      bottom: 3,
                    }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--clr-border)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)', marginBottom: 8 }}>LEYENDA</div>
            {[
              { color: 'var(--clr-neon)', label: 'Confirmada' },
              { color: 'var(--clr-warn)', label: 'Pendiente' },
              { color: 'var(--clr-danger)', label: 'Cancelada' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', marginBottom: 4, color: 'var(--clr-text-muted)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, flexShrink: 0 }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Time grid */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--clr-border)',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em', fontSize: '1rem' }}>
              {format(selectedDate, "EEEE d 'de' MMMM", { locale: es }).toUpperCase()}
            </span>
            <span style={{
              fontSize: '0.7rem',
              background: 'rgba(74,222,128,0.1)',
              color: 'var(--clr-neon)',
              padding: '2px 8px',
              borderRadius: 99,
              fontFamily: 'var(--font-mono)',
            }}>
              Cancha {selectedCancha} — {reservasDelDia.length} reservas
            </span>
          </div>

          <div style={{ overflowY: 'auto', maxHeight: 520 }}>
            {HORAS.map(hora => {
              const reserva = reservasDelDia.find(r => r.horaInicio === hora && r.cancha === selectedCancha);
              return (
                <div
                  key={hora}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '64px 1fr',
                    borderBottom: '1px solid var(--clr-border)',
                    minHeight: 56,
                  }}
                >
                  <div style={{
                    padding: '12px 12px',
                    fontSize: '0.7rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--clr-text-dim)',
                    borderRight: '1px solid var(--clr-border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    paddingTop: 14,
                  }}>
                    {hora}
                  </div>
                  <div style={{ padding: '8px 12px' }}>
                    {reserva ? (
                      <div style={{
                        padding: '8px 12px',
                        borderRadius: 'var(--radius-sm)',
                        background: `${estadoColors[reserva.estado]}10`,
                        borderLeft: `3px solid ${estadoColors[reserva.estado]}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <User size={13} style={{ color: estadoColors[reserva.estado] }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{reserva.cliente}</span>
                          <Clock size={12} style={{ color: 'var(--clr-text-muted)' }} />
                          <span style={{ fontSize: '0.75rem', color: 'var(--clr-text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {reserva.horaInicio} – {reserva.horaFin}
                          </span>
                        </div>
                        <span style={{
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          color: estadoColors[reserva.estado],
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                        }}>
                          {reserva.estado}
                        </span>
                      </div>
                    ) : (
                      <button
                        style={{
                          width: '100%', textAlign: 'left',
                          padding: '8px 12px',
                          fontSize: '0.75rem',
                          color: 'var(--clr-text-dim)',
                          background: 'transparent',
                          border: '1px dashed var(--clr-border)',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--clr-neon-dim)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--clr-neon)';
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--clr-border)';
                          (e.currentTarget as HTMLButtonElement).style.color = 'var(--clr-text-dim)';
                        }}
                      >
                        + Disponible
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
