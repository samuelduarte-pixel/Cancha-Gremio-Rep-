import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '@/api/auth';
import { Loader2 } from 'lucide-react';

// =============================================
// Delete Account Confirm — completa la eliminación
// /eliminar-cuenta?token=XXXX (enlace del correo)
// =============================================

export default function DeleteAccountConfirmPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'missing'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('missing');
      setMessage('Falta el token en la URL.');
      return;
    }
    authApi
      .confirmarEliminarCuenta(token)
      .then(res => {
        setStatus('success');
        setMessage(res.data?.message || 'Tu cuenta fue eliminada.');
        localStorage.removeItem('cg_token');
        localStorage.removeItem('cg_refresh');
        localStorage.removeItem('cg_user');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err?.response?.data?.detail || 'No se pudo completar la eliminación.');
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
          {status === 'loading' ? 'ELIMINANDO CUENTA…' : status === 'success' ? '✅ CUENTA ELIMINADA' : '⚠ ERROR'}
        </h2>

        {status === 'loading' && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 8 }}>
            <Loader2 size={28} style={{ animation: 'spin 0.8s linear infinite', color: 'var(--clr-neon)' }} />
          </div>
        )}

        <p style={{ color: 'var(--clr-text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 20 }}>
          {message}
          {status === 'success' && ' Ya no podrás iniciar sesión con esta cuenta.'}
        </p>

        {status === 'success' && (
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/')}>
            VOLVER AL INICIO
          </button>
        )}

        {status !== 'success' && (
          <Link to="/login" style={{ color: 'var(--clr-neon)', fontSize: '0.8rem', fontWeight: 600 }}>
            Ir al inicio de sesión
          </Link>
        )}
      </div>
    </div>
  );
}