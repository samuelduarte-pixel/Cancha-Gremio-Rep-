import { useState, FormEvent } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { authApi } from '@/api/auth';
import { AlertTriangle, Loader2 } from 'lucide-react';

// =============================================
// Delete Account Modal — eliminación con doble confirmación
// Paso 1: advertir y escribir el correo para habilitar
// Paso 2: confirmar con contraseña → se envía enlace al correo
// =============================================

interface Props {
  onClose: () => void;
}

function clearLocalSession() {
  localStorage.removeItem('cg_token');
  localStorage.removeItem('cg_refresh');
  localStorage.removeItem('cg_user');
}

export default function DeleteAccountModal({ onClose }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [typedEmail, setTypedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationUrl, setConfirmationUrl] = useState<string | undefined>(undefined);

  const emailOk = user?.email && typedEmail.trim().toLowerCase() === user.email.toLowerCase();

  async function handleFinalConfirm(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.solicitarEliminarCuenta(password);
      setConfirmationUrl(res.data?.confirmation_url);
      setStep(3);
      toast(res.data?.mensaje || 'Revisa tu correo para completar la eliminación.', 'success');
      // Se limpia la sesión local; la cuenta solo desaparece al abrir el enlace por correo
      clearLocalSession();
    } catch (err: any) {
      toast(err?.response?.data?.detail || 'No se pudo iniciar la eliminación', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, padding: 20,
    }}>
      <div className="card fade-up" style={{ width: '100%', maxWidth: 480, padding: 28, position: 'relative', border: '1px solid rgba(239,68,68,0.3)' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: 'var(--clr-text-muted)', cursor: 'pointer', fontSize: '1.1rem' }}>✕</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <span style={{
            width: 40, height: 40, borderRadius: 'var(--radius-sm)',
            background: 'rgba(239,68,68,0.15)', color: '#ef4444',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={20} />
          </span>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', letterSpacing: '0.05em', color: '#ef4444' }}>
            ELIMINAR CUENTA
          </h2>
        </div>

        {step === 1 && (
          <>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 16 }}>
              Esta acción es <strong style={{ color: '#ef4444' }}>permanente e irreversible</strong>. Se eliminará tu cuenta,
              se anonimizarán tus datos personales y no podrás volver a iniciar sesión.
              Para confirmar, escribe tu correo electrónico:
            </p>

            <label className="req" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>
              {user?.email}
            </label>
            <input
              type="email"
              value={typedEmail}
              onChange={e => setTypedEmail(e.target.value)}
              placeholder="Escribe tu correo para confirmar"
              style={{ width: '100%', borderColor: emailOk ? 'var(--clr-neon)' : 'var(--clr-border)' }}
            />

            <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
              <button type="button" onClick={onClose} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Cancelar</button>
              <button
                type="button"
                disabled={!emailOk}
                onClick={() => setStep(2)}
                className="btn"
                style={{
                  flex: 1, justifyContent: 'center',
                  background: '#ef4444', color: '#fff',
                  cursor: emailOk ? 'pointer' : 'not-allowed',
                  opacity: emailOk ? 1 : 0.5,
                }}
              >
                Continuar
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleFinalConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              Confirmación final: ingresa tu contraseña para solicitar la eliminación.
              Te enviaremos un <strong style={{ color: 'var(--clr-neon)' }}>enlace de confirmación por correo</strong>;
              la cuenta solo se eliminará al abrir ese enlace.
            </p>

            <div>
              <label className="req" style={{ fontSize: '0.75rem', marginBottom: 4, display: 'block', color: 'var(--clr-text-muted)' }}>Contraseña</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button type="button" onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>Atrás</button>
              <button type="submit" disabled={loading || !password} className="btn" style={{ flex: 1, justifyContent: 'center', background: '#ef4444', color: '#fff' }}>
                {loading ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Solicitar eliminación'}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>📬</div>
            <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 16 }}>
              Te enviamos el enlace de confirmación de eliminación. La cuenta desaparecerá al abrirlo.
            </p>
            {confirmationUrl && (
              <div style={{ background: 'var(--clr-surface)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 16, fontSize: '0.75rem', wordBreak: 'break-all' }}>
                <div style={{ fontWeight: 600, marginBottom: 6, color: 'var(--clr-text)' }}>Modo desarrollo — enlace de eliminación:</div>
                <a href={confirmationUrl} style={{ color: 'var(--clr-neon)' }}>{confirmationUrl}</a>
              </div>
            )}
            <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={onClose}>Cerrar</button>
          </div>
        )}
      </div>
    </div>
  );
}