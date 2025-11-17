import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function OrganizerLogin() {
  const router = useRouter();
  const [groupId, setGroupId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!groupId.trim() || !pin.trim()) {
      setError('❌ Bitte Gruppen-ID und PIN eingeben');
      setLoading(false);
      return;
    }

    try {
      // Fetch group and validate PIN
      const response = await fetch(`/api/groups/list?organizerId=${groupId}&pin=${pin}`);
      const data = await response.json();

      if (!response.ok || !data.groups || data.groups.length === 0) {
        setError('❌ Gruppe nicht gefunden oder falscher PIN');
        setLoading(false);
        return;
      }

      // Save session
      localStorage.setItem(`organizer_${groupId}`, JSON.stringify({ pin, loggedInAt: new Date().toISOString() }));

      // Redirect to organizer dashboard
      router.push(`/organizer/${groupId}`);
    } catch (err) {
      console.error('Login error:', err);
      setError('❌ Fehler beim Anmelden. Bitte versuche es später erneut.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-orange-500 to-amber-600 mb-2">
            🎯 Organisator-Login
          </h1>
          <p className="text-gray-600">Melde dich mit deiner Gruppen-ID und PIN an</p>
        </div>

        {/* Login Card */}
        <div className="card bg-white shadow-xl border-2 border-orange-200 mb-6">
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Group ID Input */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                🔑 Gruppen-ID
              </label>
              <input
                type="text"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                placeholder="z.B. abc123def456"
                className="input-field w-full font-mono"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Findest du in deinem Organisator-Link
              </p>
            </div>

            {/* PIN Input */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700">
                🔐 PIN (3-stellig)
              </label>
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value.slice(0, 3))}
                placeholder="z.B. 123"
                maxLength="3"
                className="input-field w-full text-center text-2xl tracking-widest"
              />
              <p className="text-xs text-gray-500 mt-1">
                Die PIN hast du bei der Gruppenerstellung festgelegt
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? '🔄 Wird überprüft...' : '🔓 Anmelden'}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded text-sm text-gray-700">
              <p className="font-semibold mb-2">💡 Erstes Mal hier?</p>
              <p className="text-xs mb-3">
                Wenn du noch keine Gruppe erstellt hast, klicke auf „Neue Wichtelgruppe anlegen" auf der Startseite. Dort erhältst du deine Gruppen-ID und PIN.
              </p>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="text-center">
          <Link href="/">
            <a className="text-red-600 hover:underline font-semibold">
              ← Zurück zur Startseite
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
}
