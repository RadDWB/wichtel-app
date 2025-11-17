import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function OrganizerLogin() {
  const router = useRouter();
  const [groupId, setGroupId] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1 = Enter ID, 2 = Enter PIN

  const handleGroupIdSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!groupId.trim()) {
        setError('Bitte gib eine Gruppen-ID ein');
        setLoading(false);
        return;
      }

      // Check if group exists
      const response = await fetch(`/api/groups/list?groupId=${groupId.trim()}`);
      const data = await response.json();

      if (!data.groups || data.groups.length === 0) {
        setError('❌ Gruppe nicht gefunden. Bitte überprüfe die ID.');
        setLoading(false);
        return;
      }

      // Group exists, move to PIN entry
      setStep(2);
    } catch (err) {
      setError('Fehler beim Überprüfen der Gruppe');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!pin.trim()) {
        setError('Bitte gib deine PIN ein');
        setLoading(false);
        return;
      }

      // Verify PIN
      const response = await fetch(
        `/api/groups/list?groupId=${groupId.trim()}&pin=${pin.trim()}`
      );
      const data = await response.json();

      if (!data.groups || data.groups.length === 0) {
        setError('❌ PIN ist ungültig. Bitte versuche es erneut.');
        setLoading(false);
        return;
      }

      // PIN correct, redirect to dashboard
      localStorage.setItem(`organizer_${groupId.trim()}`, JSON.stringify({
        pin: pin.trim(),
        verifiedAt: new Date().toISOString()
      }));

      router.push(`/organizer/${groupId.trim()}`);
    } catch (err) {
      setError('Fehler beim Überprüfen der PIN');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🎁</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Meine Gruppen</h1>
            <p className="text-gray-600">Wichtel Online - Organisator Zugang</p>
          </div>

          {step === 1 ? (
            // Step 1: Enter Group ID
            <form onSubmit={handleGroupIdSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gruppen-ID
                </label>
                <input
                  type="text"
                  value={groupId}
                  onChange={(e) => setGroupId(e.target.value.toUpperCase())}
                  placeholder="z.B. ABC12345"
                  className="input-field w-full text-center text-lg font-mono tracking-widest"
                  autoFocus
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Du findest diese ID in deinem Organisations-Link oder in deiner Bestätigung
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
              >
                {loading ? '🔄 Wird überprüft...' : '➜ Weiter'}
              </button>
            </form>
          ) : (
            // Step 2: Enter PIN
            <form onSubmit={handlePinSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Gruppen-ID:</strong>
                </p>
                <p className="text-2xl font-bold text-blue-600 font-mono tracking-widest">
                  {groupId}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deine 3-stellige PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength="3"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="●●●"
                  className="input-field w-full text-center text-4xl font-bold tracking-widest"
                  autoFocus
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-2">
                  Du erhältst diese PIN nach dem Erstellen deiner Gruppe
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setPin('');
                    setError('');
                  }}
                  className="flex-1 btn-outline"
                >
                  ← Zurück
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? '🔄 Wird überprüft...' : '🔓 Anmelden'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link href="/">
              <a className="text-center block text-blue-600 hover:underline text-sm">
                ← Zurück zur Startseite
              </a>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
