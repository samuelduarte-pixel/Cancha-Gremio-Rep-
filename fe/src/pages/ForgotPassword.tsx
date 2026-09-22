// FE/src/pages/ForgotPassword.jsx
// Que: Página "Olvidé mi contraseña"
// Para que: El usuario ingresa su correo y recibe el link de reset
// Ruta: /forgot-password

import { useState, type FormEvent } from 'react';
import { authApi } from '@/api/auth';

export default function ForgotPassword() {
  const [correo, setCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [resetUrl, setResetUrl] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await authApi.forgotPassword(correo);
      setResetUrl((res.data as any)?.reset_url || null);
      setEnviado(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error al enviar el correo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        <div className="text-center mb-6">
          <span className="text-4xl">⚽</span>
          <h1 className="text-2xl font-bold text-green-700 mt-2">Cancha Gremio</h1>
          <p className="text-gray-500 text-sm mt-1">Recuperar contraseña</p>
        </div>

        {enviado ? (
          <div className="text-center">
            <div className="text-5xl mb-4">📧</div>
            <h2 className="text-lg font-semibold text-gray-800">¡Correo enviado!</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Si tu correo está registrado, recibirás un enlace para restablecer
              tu contraseña. Revisa también la carpeta de spam.
            </p>
            {resetUrl && (
              <div className="mt-4 bg-gray-100 rounded-lg p-3 text-left">
                <p className="text-xs text-gray-500 mb-1 font-semibold">
                  Modo desarrollo — enlace de recuperación:
                </p>
                <a href={resetUrl} className="text-green-700 text-xs break-all hover:underline">
                  {resetUrl}
                </a>
              </div>
            )}
            <a
              href="/login"
              className="mt-6 inline-block text-green-700 font-medium hover:underline text-sm"
            >
              ← Volver al inicio de sesión
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-gray-600 text-sm">
              Ingresa tu correo registrado y te enviaremos un enlace para
              restablecer tu contraseña.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={correo}
                onChange={(e) => setCorreo(e.target.value)}
                placeholder="tucorreo@ejemplo.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
            >
              {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>

            <div className="text-center">
              <a href="/login" className="text-sm text-green-700 hover:underline">
                ← Volver al inicio de sesión
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
