import { useState } from 'react';
import { useRouter } from 'next/router';
import { setAdminSession } from '../../lib/admin';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simple client-side check
      if (setAdminSession(password)) {
        router.push('/admin/dashboard');
      } else {
        setError('❌ Falsches Passwort. Bitte versuche es erneut.');
      }
    } catch (err) {
      setError('Fehler beim Anmelden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
            <p className="text-gray-600">Julklapp Online v1.3.0</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin-Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben..."
                className="input-field w-full"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-gray-900 to-gray-700 text-white font-bold py-3 rounded-lg hover:from-gray-800 hover:to-gray-600 transition disabled:opacity-50"
            >
              {loading ? '🔄 Wird überprüft...' : '🔓 Anmelden'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-center text-gray-500">
              Nur für Administratoren 🛡️
            </p>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <a href="/" className="text-white hover:underline text-sm">
            ← Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}
