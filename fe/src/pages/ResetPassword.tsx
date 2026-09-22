// FE/src/pages/ResetPassword.jsx
// Que: Página para ingresar la nueva contraseña
// Para que: El usuario llega aquí desde el link del email
// Ruta: /reset-password?token=XXXX

import { useState, type FormEvent } from 'react';
import { authApi } from '@/api/auth';

export default function ResetPassword() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [verPassword, setVerPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [exito, setExito] = useState(false);
  const [error, setError] = useState('');

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8 text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-lg font-semibold text-gray-800">Enlace inválido</h2>
          <p className="text-gray-500 mt-2 text-sm">
            Este enlace no es válido. Por favor solicita uno nuevo.
          </p>
          <a
            href="/forgot-password"
            className="mt-6 inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700"
          >
            Solicitar nuevo enlace
          </a>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword(token, password);
      setExito(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  const fortaleza =
    password.length === 0 ? null :
    password.length >= 12 ? 'fuerte' :
    password.length >= 8  ? 'media'  : 'debil';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-md p-8">

        <div className="text-center mb-6">
          <span className="text-4xl">⚽</span>
          <h1 className="text-2xl font-bold text-green-700 mt-2">Cancha Gremio</h1>
          <p className="text-gray-500 text-sm mt-1">Nueva contraseña</p>
        </div>

        {exito ? (
          <div className="text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-lg font-semibold text-gray-800">¡Contraseña actualizada!</h2>
            <p className="text-gray-500 mt-2 text-sm">
              Tu contraseña fue restablecida. Ya puedes iniciar sesión.
            </p>
            <a
              href="/login"
              className="mt-6 inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
            >
              Ir al inicio de sesión
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-gray-600 text-sm">
              Ingresa tu nueva contraseña. Debe tener al menos 8 caracteres.
            </p>

            {/* Nueva contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nueva contraseña
              </label>
              <div className="relative">
                <input
                  type={verPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {verPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Indicador de fortaleza */}
              {fortaleza && (
                <div className="mt-1 text-xs">
                  Fortaleza:{' '}
                  <span className={
                    fortaleza === 'fuerte' ? 'text-green-600 font-semibold' :
                    fortaleza === 'media'  ? 'text-yellow-600 font-semibold' :
                                            'text-red-500 font-semibold'
                  }>
                    {fortaleza === 'fuerte' ? 'Fuerte ✅' :
                     fortaleza === 'media'  ? 'Aceptable ⚠️' : 'Débil ❌'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirmar contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar contraseña
              </label>
              <input
                type={verPassword ? 'text' : 'password'}
                required
                value={confirmar}
                onChange={(e) => setConfirmar(e.target.value)}
                placeholder="Repite tu nueva contraseña"
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
              {loading ? 'Guardando...' : 'Restablecer contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
