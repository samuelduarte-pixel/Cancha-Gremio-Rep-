import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import {
  LayoutDashboard, CalendarDays, Users, Trophy,
  Wrench, BarChart3, LogOut, Menu, X, MonitorSmartphone, Trash2
} from 'lucide-react';
import { useState } from 'react';
import DeleteAccountModal from './DeleteAccountModal';

// =============================================
// Sidebar Navigation
// =============================================

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { path: '/dashboard',     label: 'Dashboard',   icon: <LayoutDashboard size={18} />, adminOnly: true },
  { path: '/inicio',        label: 'Inicio',      icon: <LayoutDashboard size={18} /> },
  { path: '/reservas',      label: 'Reservas',    icon: <CalendarDays size={18} /> },
  { path: '/clientes',      label: 'Clientes',    icon: <Users size={18} />, adminOnly: true },
  { path: '/eventos',       label: 'Eventos',     icon: <Trophy size={18} /> },
  { path: '/mantenimiento', label: 'Mantenimiento', icon: <Wrench size={18} />, adminOnly: true },
  { path: '/reportes',      label: 'Reportes',    icon: <BarChart3 size={18} />, adminOnly: true },
];

export default function Sidebar() {
  const { user, logout, logoutAll } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const handleLogout = () => {
    logout();
    toast('Sesión cerrada correctamente', 'success');
    navigate('/login');
  };

  const handleLogoutAll = () => {
    if (!window.confirm('¿Cerrar sesión en todos los dispositivos? Se invalidarán tus tokens en cualquier equipo.')) return;
    logoutAll();
    toast('Sesión cerrada en todos los dispositivos', 'success');
    navigate('/login');
  };

  const filtered = navItems.filter(item => !item.adminOnly || user?.rol === 'admin');

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="btn sidebar-mobile-toggle"
        onClick={() => setOpen(!open)}
        style={{
          position: 'fixed', top: 20, left: 14, zIndex: 200,
          padding: 8,
          background: 'var(--clr-surface)',
          border: '1px solid var(--clr-border-md)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--clr-text)',
        }}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        id="mobile-menu-btn"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="sidebar-overlay"
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
            zIndex: 150,
          }}
          id="sidebar-overlay"
        />
      )}

      <aside className={`app-sidebar${open ? ' sidebar-open' : ''}`} style={{
        width: 'var(--sidebar-w)',
        background: 'var(--clr-bg-card)',
        borderRight: '1px solid var(--clr-border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--clr-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36,
              background: 'var(--clr-neon)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontSize: '1.1rem' }}>⚽</span>
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                letterSpacing: '0.05em',
                color: 'var(--clr-neon)',
                lineHeight: 1,
              }}>
                CANCHA
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: 'var(--clr-text-muted)',
                letterSpacing: '0.15em',
              }}>
                GREMIO v1.0
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px' }}>
          <div style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            color: 'var(--clr-text-dim)',
            padding: '0 8px',
            marginBottom: 8,
            textTransform: 'uppercase',
          }}>
            MENÚ
          </div>
          {filtered.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 2,
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? 'var(--clr-neon)' : 'var(--clr-text-muted)',
                background: isActive ? 'rgba(74, 222, 128, 0.08)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--clr-neon)' : '2px solid transparent',
                transition: 'all 0.15s ease',
              })}
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div style={{
          padding: '16px 12px',
          borderTop: '1px solid var(--clr-border)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            background: 'var(--clr-surface)',
            borderRadius: 'var(--radius-sm)',
            marginBottom: 8,
          }}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, var(--clr-neon-dim), var(--clr-accent))',
              borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.8rem', fontWeight: 700, color: '#060a07',
              flexShrink: 0,
            }}>
              {user?.nombre?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--clr-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.nombre} {user?.apellido}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--clr-text-muted)' }}>
                {user?.rol === 'admin' ? 'Administrador' : 'Cliente'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
          >
            <LogOut size={14} />
            Cerrar sesión
          </button>

          {/* Opciones avanzadas de cuenta */}
          <button
            onClick={handleLogoutAll}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', marginTop: 6 }}
            title="Invalida esta y todas las demás sesiones activas"
          >
            <MonitorSmartphone size={14} />
            Cerrar en todos los dispositivos
          </button>
          <button
            onClick={() => setShowDeleteAccount(true)}
            className="btn btn-ghost"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem', marginTop: 6, color: '#ef4444' }}
            title="Elimina permanentemente tu cuenta"
          >
            <Trash2 size={14} />
            Eliminar mi cuenta
          </button>
        </div>
      </aside>

      {/* Modal de eliminación de cuenta (doble confirmación) */}
      {showDeleteAccount && <DeleteAccountModal onClose={() => setShowDeleteAccount(false)} />}
    </>
  );
}
