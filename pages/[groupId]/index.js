import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getGroup } from '../../lib/kv-client';

export const getServerSideProps = async () => {
  return { props: {} };
};

export default function GroupEntryPoint() {
  const router = useRouter();
  const { groupId } = router.query;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  useEffect(() => {
    if (groupId) {
      loadGroup();
    }
  }, [groupId]);

  const loadGroup = async () => {
    try {
      setLoading(true);
      const groupData = await getGroup(groupId);
      if (groupData) {
        setGroup(groupData);
      }
    } catch (err) {
      console.error('Error loading group:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizerAccess = async () => {
    if (!pinInput.trim()) {
      setPinError('Bitte gib deine PIN ein');
      return;
    }

    if (!group || group.organizerPin !== pinInput.trim()) {
      setPinError('PIN ungültig');
      setPinInput('');
      return;
    }

    // Store verification and redirect
    localStorage.setItem(`organizer_${groupId}`, JSON.stringify({
      pin: pinInput.trim(),
      verifiedAt: new Date().toISOString()
    }));

    router.push(`/organizer/${groupId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <p className="text-2xl text-gray-600">Lädt...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900 mb-4">Gruppe nicht gefunden</p>
          <a href="/" className="text-blue-600 hover:underline">
            Zurück zur Startseite
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4">
        {/* Group Header */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-8 shadow-lg text-center mb-8">
            <h1 className="text-4xl font-bold mb-3">Willkommen!</h1>
            <p className="text-2xl font-semibold mb-2">{group.name}</p>
            <p className="text-base opacity-90">Organisiert von: {group.organizerName}</p>
          </div>

          {/* Role Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Organizer Button */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-green-300 hover:shadow-xl transition">
              <div className="text-6xl mb-4 text-center">🔐</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Ich bin Organisator
              </h2>
              <p className="text-gray-700 mb-6 text-center">
                Du hast diese Gruppe erstellt und möchtest sie verwalten?
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleOrganizerAccess();
                }}
                className="space-y-4"
              >
                {pinError && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm">
                    {pinError}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deine 3-stellige PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength="3"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/[^0-9]/g, ''));
                      setPinError('');
                    }}
                    placeholder="●●●"
                    className="w-full text-center text-4xl font-bold tracking-widest px-3 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Diese PIN hast du beim Erstellen der Gruppe erhalten
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-lg transition shadow-md"
                >
                  Zum Dashboard
                </button>
              </form>
            </div>

            {/* Participant Button */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-2 border-blue-300 hover:shadow-xl transition">
              <div className="text-6xl mb-4 text-center">👤</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4 text-center">
                Ich bin Teilnehmer
              </h2>
              <p className="text-gray-700 mb-6 text-center">
                Du wurdest eingeladen und möchtest deine Wunschliste eintragen?
              </p>

              <button
                onClick={() => router.push(`/join/${groupId}`)}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-bold py-3 rounded-lg transition shadow-md"
              >
                Zum Beitritt
              </button>

              <p className="text-xs text-gray-600 mt-4 text-center">
                Klick hier, um teilzunehmen und deine Geschenkwünsche einzutragen.
              </p>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="max-w-2xl mx-auto bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
          <p className="text-sm text-gray-700">
            <strong>ℹ️ Hinweis:</strong> Dies ist der zentrale Einstiegspunkt für diese Gruppe. Hier können Organisatoren und Teilnehmer sich entsprechend anmelden. Wenn du einen direkten Link hast, kannst du diesen natürlich auch direkt nutzen.
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center mt-12">
          <a href="/" className="text-blue-600 hover:underline font-semibold">
            Zurück zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}
