import { useState, FormEvent, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/api/auth';
import { Loader2, Check, X } from 'lucide-react';

const ALLOWED_SPECIAL = new Set('@$!%*?&#._-');
const MIN_LENGTH = 8;

function getPasswordErrors(password: string): string[] {
  const errors: string[] = [];
  if (password.length < MIN_LENGTH && password.length > 0) {
    errors.push(`Mínimo ${MIN_LENGTH} caracteres`);
  }
  const invalidChars = new Set<string>();
  for (const ch of password) {
    if (/[a-zA-Z0-9]/.test(ch)) continue;
    if (ALLOWED_SPECIAL.has(ch)) continue;
    invalidChars.add(ch);
  }
  if (invalidChars.size > 0) {
    errors.push(`Caracteres no permitidos: ${[...invalidChars].join(' ')}`);
  }
  return errors;
}

// =============================================
// Register Page
// =============================================

export default function RegisterPage() {
  const { toast } = useToast();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '',
    telefono: '', password: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [registered, setRegistered] = useState(false);

  const passwordErrors = useMemo(() => getPasswordErrors(form.password), [form.password]);
  const passwordsMatch = form.password === form.confirmPassword;
  const passwordOk = form.password.length >= MIN_LENGTH && passwordErrors.length === 0;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      toast('Las contraseñas no coinciden', 'error');
      return;
    }
    if (passwordErrors.length > 0) {
      toast(passwordErrors.join(' | '), 'error');
      return;
    }
    setLoading(true);
    try {
      await authApi.register({
        nombre: form.nombre,
        apellido: form.apellido,
        correo: form.email,
        password: form.password,
        telefono: form.telefono,
      });

      setRegistered(true);

      try {
        await login(form.email, form.password);
        toast('¡Cuenta creada! Bienvenido a Cancha Gremio.', 'success');
        navigate('/inicio', { replace: true });
      } catch {
        toast('Cuenta creada correctamente. Ya puedes iniciar sesión.', 'success');
        setTimeout(() => navigate('/login'), 1500);
      }
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || 'Error al crear la cuenta';
      toast(msg, 'error');
      setLoading(false);
    }
  }

  const fields = [
    { name: 'nombre', label: 'Nombre', placeholder: 'Juan', type: 'text' },
    { name: 'apellido', label: 'Apellido', placeholder: 'García', type: 'text' },
    { name: 'email', label: 'Correo electrónico', placeholder: 'juan@email.com', type: 'email' },
    { name: 'telefono', label: 'Teléfono', placeholder: '3001234567', type: 'tel' },
    { name: 'password', label: 'Contraseña', placeholder: '••••••••', type: showPassword ? 'text' : 'password' },
    { name: 'confirmPassword', label: 'Confirmar contraseña', placeholder: '••••••••', type: showConfirm ? 'text' : 'password' },
  ] as const;

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--clr-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div className="fade-up" style={{ width: '100%', maxWidth: 480 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Link to="/" style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2rem',
            color: 'var(--clr-neon)',
            letterSpacing: '0.1em',
          }}>
            ⚽ CANCHA GREMIO
          </Link>
          <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Crea tu cuenta para empezar a reservar
          </p>
        </div>

        {registered ? (
          <div className="card" style={{ padding: 32, textAlign: 'center' }}>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.6rem',
              letterSpacing: '0.05em',
              marginBottom: 16,
            }}>
              ✅ ¡CUENTA CREADA!
            </h2>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 12 }}>
              Tu cuenta <strong style={{ color: 'var(--clr-neon)' }}>{form.email}</strong> quedó registrada
              correctamente y ya está lista para usar.
            </p>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: 20 }}>
              Te estamos llevando a tu página para que empieces a reservar ⚽…
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
              <Loader2 size={24} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--clr-neon)' }} />
            </div>
          </div>
        ) : (

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.6rem',
            letterSpacing: '0.05em',
            marginBottom: 24,
          }}>
            CREAR CUENTA
          </h2>

          <form onSubmit={handleSubmit}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 14,
              marginBottom: 14,
            }}>
              {fields.slice(0, 2).map(f => (
                <div key={f.name}>
                  <label>{f.label}</label>
                  <input
                    name={f.name}
                    type={f.type}
                    value={form[f.name]}
                    onChange={handleChange}
                    placeholder={f.placeholder}
                    required
                  />
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 12 }}>
              {fields.slice(2).map(f => (
                <div key={f.name}>
                  <label>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      name={f.name}
                      type={f.type}
                      value={form[f.name]}
                      onChange={handleChange}
                      placeholder={f.placeholder}
                      required
                      style={{ paddingRight: 36 }}
                    />
                    {f.name === 'password' && form.password && (
                      <span
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--clr-text-muted)', fontSize: '0.75rem' }}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </span>
                    )}
                    {f.name === 'confirmPassword' && form.confirmPassword && (
                      <span
                        onClick={() => setShowConfirm(!showConfirm)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--clr-text-muted)', fontSize: '0.75rem' }}
                      >
                        {showConfirm ? '🙈' : '👁️'}
                      </span>
                    )}
                  </div>
                  {f.name === 'confirmPassword' && form.confirmPassword && !passwordsMatch && (
                    <span style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: 4, display: 'block' }}>
                      Las contraseñas no coinciden
                    </span>
                  )}
                </div>
              ))}
            </div>

            {form.password && (
              <div style={{
                background: 'var(--clr-surface)',
                borderRadius: 'var(--radius-sm)',
                padding: '12px 14px',
                marginBottom: 16,
                fontSize: '0.75rem',
              }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--clr-text)' }}>
                  Requisitos de contraseña:
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: form.password.length >= MIN_LENGTH ? '#4ade80' : 'var(--clr-text-muted)' }}>
                    {form.password.length >= MIN_LENGTH ? <Check size={14} /> : <X size={14} />}
                    Mínimo {MIN_LENGTH} caracteres
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: passwordErrors.length === 0 ? '#4ade80' : 'var(--clr-text-muted)' }}>
                    {passwordErrors.length === 0 ? <Check size={14} /> : <X size={14} />}
                    Solo caracteres permitidos
                  </div>
                </div>
                <div style={{
                  marginTop: 8,
                  padding: '8px 10px',
                  background: 'var(--clr-bg)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.7rem',
                  lineHeight: 1.6,
                  color: 'var(--clr-text-muted)',
                }}>
                  <span style={{ color: '#4ade80' }}>✓ Permitidos:</span> Letras (a-z A-Z) Números (0-9) Especiales: @ $ ! % * ? &amp; # . _ -<br />
                  <span style={{ color: '#ef4444' }}>✗ No permitidos:</span> Espacios y otros caracteres especiales
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !passwordOk || !passwordsMatch}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', padding: 12 }}
            >
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Creando...</> : 'CREAR CUENTA'}
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
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: 'var(--clr-neon)', fontWeight: 600 }}>
              Iniciar sesión
            </Link>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
