import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Loader2 } from 'lucide-react';

// =============================================
// Confirm Email — valida el enlace de registro
// /confirmar-correo?token=XXXX
// =============================================

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      setMessage('Falta el token de confirmación en la URL.');
      return;
    }
    authApi
      .confirmar(token)
      .then(res => {
        setStatus('success');
        setMessage(res.data?.message || 'Correo confirmado correctamente.');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err?.response?.data?.detail || 'No se pudo confirmar el correo.');
      });
  }, [token]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--clr-bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div className="fade-up card" style={{ width: '100%', maxWidth: 460, padding: 32, textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.05em', marginBottom: 16 }}>
          {status === 'loading' ? 'CONFIRMANDO…' : status === 'success' ? '✅ ¡CORREO CONFIRMADO!' : '⚠ ERROR EN LA CONFIRMACIÓN'}
        </h2>

        {status === 'loading' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
            <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--clr-neon)' }} />
          </div>
        )}

        <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 20 }}>
          {message}
        </p>

        {status === 'success' && (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
            IR A INICIAR SESIÓN
          </button>
        )}

        {status !== 'success' && (
          <Link to="/registro" style={{ color: 'var(--clr-neon)', fontSize: '0.8rem', fontWeight: 600 }}>
            Volver al registro
          </Link>
        )}
      </div>
    </div>
  );
}