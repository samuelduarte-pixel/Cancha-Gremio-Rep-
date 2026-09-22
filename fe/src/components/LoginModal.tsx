import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Eye, EyeOff, Loader2, X } from 'lucide-react';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
}

export default function LoginModal({ open, onClose }: LoginModalProps) {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast('Completa todos los campos', 'warning');
      return;
    }
    try {
      await login(email, password);
      toast('Bienvenido de vuelta 👋', 'success');
      onClose();
      navigate(email.includes('admin') ? '/dashboard' : '/inicio');
    } catch (err: any) {
      toast(err?.message || 'Credenciales incorrectas', 'error');
    }
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card fade-up"
        style={{
          width: '100%',
          maxWidth: 420,
          padding: 32,
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 16, right: 16,
            background: 'transparent',
            border: 'none',
            color: 'var(--clr-text-muted)',
            cursor: 'pointer',
          }}
          aria-label="Cerrar"
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 8,
          }}>
            <div style={{
              width: 42, height: 42,
              background: 'var(--clr-neon)',
              borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.3rem',
              boxShadow: 'var(--shadow-neon)',
            }}>
              ⚽
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.6rem',
                color: 'var(--clr-neon)',
                letterSpacing: '0.1em',
                lineHeight: 1,
              }}>
                CANCHA GREMIO
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: 'var(--clr-text-muted)',
                letterSpacing: '0.2em',
              }}>
                SISTEMA DE RESERVAS
              </div>
            </div>
          </div>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '1.4rem',
          letterSpacing: '0.05em',
          marginBottom: 4,
        }}>
          INICIAR SESIÓN
        </h2>
        <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
          Accede a tu cuenta para gestionar reservas
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label htmlFor="lg-email">Correo electrónico</label>
            <input
              id="lg-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="lg-password">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                id="lg-password"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingRight: 40 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 10, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--clr-text-muted)',
                  display: 'flex', alignItems: 'center',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: 'right', marginTop: -4 }}>
            <Link to="/forgot-password" onClick={onClose} style={{ fontSize: '0.8rem', color: 'var(--clr-neon-dim)' }}>
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              width: '100%', justifyContent: 'center',
              padding: '12px',
              fontSize: '0.9rem',
              letterSpacing: '0.05em',
              marginTop: 4,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? (
              <>
                <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
                Cargando...
              </>
            ) : 'ENTRAR'}
          </button>
        </form>

        <div style={{
          marginTop: 18,
          paddingTop: 18,
          borderTop: '1px solid var(--clr-border)',
          textAlign: 'center',
          fontSize: '0.8rem',
          color: 'var(--clr-text-muted)',
        }}>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" onClick={onClose} style={{ color: 'var(--clr-neon)', fontWeight: 600 }}>
            Regístrate
          </Link>
        </div>

        <div style={{
          marginTop: 14,
          padding: '8px 12px',
          background: 'rgba(74, 222, 128, 0.05)',
          border: '1px solid var(--clr-border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.72rem',
          color: 'var(--clr-text-muted)',
          fontFamily: 'var(--font-mono)',
          textAlign: 'center',
        }}>
          Demo: admin@example.com / admin123
        </div>
      </div>
    </div>
  );
}