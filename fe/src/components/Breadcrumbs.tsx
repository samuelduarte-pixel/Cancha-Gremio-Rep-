import { Link, useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

// =============================================
// Breadcrumbs + resalta opción activa
// =============================================

const ROUTE_LABELS: Record<string, string> = {
  inicio: 'Inicio',
  reservas: 'Reservas',
  eventos: 'Eventos',
  dashboard: 'Dashboard',
  clientes: 'Clientes',
  mantenimiento: 'Mantenimiento',
  reportes: 'Reportes',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathname = location.pathname;

  if (pathname === '/' || pathname === '/login' || pathname === '/registro' || pathname === '/forgot-password' || pathname === '/reset-password') {
    return null;
  }

  const segments = pathname.split('/').filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
      <Link to="/inicio" style={{
        fontSize: '0.75rem', color: 'var(--clr-text-muted)',
        display: 'inline-flex', alignItems: 'center', gap: 4,
        transition: 'color 0.15s',
      }}>
        Inicio
      </Link>
      {segments.map((seg, i) => {
        const label = ROUTE_LABELS[seg] || seg.charAt(0).toUpperCase() + seg.slice(1);
        const isLast = i === segments.length - 1;
        return (
          <span key={seg} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ChevronRight size={12} style={{ color: 'var(--clr-text-dim)' }} />
            {isLast ? (
              <span style={{
                fontSize: '0.75rem', fontWeight: 600,
                color: 'var(--clr-neon)',
                textTransform: 'capitalize',
              }}>
                {label}
              </span>
            ) : (
              <Link to={`/${segments.slice(0, i + 1).join('/')}`} style={{
                fontSize: '0.75rem', color: 'var(--clr-text-muted)', textTransform: 'capitalize',
              }}>
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}