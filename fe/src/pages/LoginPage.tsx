import { useState, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

// =============================================
// Login Page
// =============================================

export default function LoginPage() {
  const { login, isLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email || !password) {
      toast('Completa todos los campos', 'warning');
      return;
    }
    try {
      await login(email, password);
      toast('Bienvenido de vuelta 👋', 'success');
      navigate(email.includes('admin') ? '/dashboard' : '/inicio');
    } catch (err: any) {
      toast(err?.message || 'Credenciales incorrectas', 'error');
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--clr-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background decoration */}
      <div style={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: 600, height: 600,
        background: 'radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-10%',
        width: 500, height: 500,
        background: 'radial-gradient(circle, rgba(163,230,53,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(var(--clr-border) 1px, transparent 1px), linear-gradient(90deg, var(--clr-border) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
        opacity: 0.3,
        pointerEvents: 'none',
      }} />

      <div className="fade-up" style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 12,
            marginBottom: 8,
          }}>
            <div style={{
              width: 48, height: 48,
              background: 'var(--clr-neon)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem',
              boxShadow: 'var(--shadow-neon)',
            }}>
              ⚽
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '2.5rem',
                color: 'var(--clr-neon)',
                letterSpacing: '0.1em',
                lineHeight: 1,
              }}>
                CANCHA GREMIO
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.65rem',
                color: 'var(--clr-text-muted)',
                letterSpacing: '0.2em',
              }}>
                SISTEMA DE RESERVAS
              </div>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            letterSpacing: '0.05em',
            marginBottom: 4,
          }}>
            INICIAR SESIÓN
          </h2>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
            Accede a tu cuenta para gestionar reservas
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label htmlFor="password">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="password"
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
                  }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ textAlign: 'right', marginTop: -8 }}>
              <Link to="/forgot-password" style={{ fontSize: '0.8rem', color: 'var(--clr-neon-dim)' }}>
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
            marginTop: 20,
            paddingTop: 20,
            borderTop: '1px solid var(--clr-border)',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--clr-text-muted)',
          }}>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" style={{ color: 'var(--clr-neon)', fontWeight: 600 }}>
              Regístrate
            </Link>
          </div>
        </div>

        {/* Demo hint */}
        <div style={{
          marginTop: 16,
          padding: '10px 14px',
          background: 'rgba(74, 222, 128, 0.05)',
          border: '1px solid var(--clr-border)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.75rem',
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
