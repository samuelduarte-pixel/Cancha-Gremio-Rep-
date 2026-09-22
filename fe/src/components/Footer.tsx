import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook } from 'lucide-react';

// =============================================
// Footer — parte de la interfaz (header/footer/menú)
// =============================================

export default function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--clr-border)',
      background: 'var(--clr-bg-card)',
      padding: '28px 28px',
      marginTop: 'auto',
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 24,
        maxWidth: 1200,
        margin: '0 auto',
      }}>
        {/* Marca */}
        <div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.3rem',
            letterSpacing: '0.05em',
            color: 'var(--clr-neon)',
            marginBottom: 6,
          }}>
            ⚽ CANCHA GREMIO
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--clr-text-muted)', lineHeight: 1.6, maxWidth: 260 }}>
            Sistema de reservas para cancha sintética. Organiza tus partidos, torneos y ligas.
          </p>
        </div>

        {/* Contacto */}
        <div>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--clr-text-muted)', textTransform: 'uppercase', marginBottom: 10,
          }}>
            Contacto
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem', color: 'var(--clr-text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Phone size={13} style={{ color: 'var(--clr-neon-dim)' }} /> 300 123 4567
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Mail size={13} style={{ color: 'var(--clr-neon-dim)' }} /> contacto@canchagremio.com
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <MapPin size={13} style={{ color: 'var(--clr-neon-dim)' }} /> Cra 15 # 24-30, Bogotá
            </div>
          </div>
        </div>

        {/* Enlaces */}
        <div>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--clr-text-muted)', textTransform: 'uppercase', marginBottom: 10,
          }}>
            Accesos rápidos
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}>
            <Link to="/inicio" style={{ color: 'var(--clr-text-muted)' }}>Reservar cancha</Link>
            <Link to="/eventos" style={{ color: 'var(--clr-text-muted)' }}>Eventos y torneos</Link>
            <Link to="/login" style={{ color: 'var(--clr-text-muted)' }}>Iniciar sesión</Link>
          </div>
        </div>

        {/* Redes */}
        <div>
          <div style={{
            fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.1em',
            color: 'var(--clr-text-muted)', textTransform: 'uppercase', marginBottom: 10,
          }}>
            Síguenos
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <a href="#" aria-label="Instagram" style={{
              width: 34, height: 34, borderRadius: 'var(--radius-sm)',
              background: 'var(--clr-surface)', border: '1px solid var(--clr-border-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--clr-text-muted)',
            }}>
              <Instagram size={15} />
            </a>
            <a href="#" aria-label="Facebook" style={{
              width: 34, height: 34, borderRadius: 'var(--radius-sm)',
              background: 'var(--clr-surface)', border: '1px solid var(--clr-border-md)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--clr-text-muted)',
            }}>
              <Facebook size={15} />
            </a>
          </div>
        </div>
      </div>

      <div style={{
        borderTop: '1px solid var(--clr-border)',
        marginTop: 24,
        paddingTop: 16,
        textAlign: 'center',
        fontSize: '0.7rem',
        color: 'var(--clr-text-dim)',
        fontFamily: 'var(--font-mono)',
      }}>
        © {new Date().getFullYear()} Cancha Gremio · Todos los derechos reservados
      </div>
    </footer>
  );
}