import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';

export default function DrawPage() {
  const router = useRouter();
  const { id } = router.query;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (id) {
      loadGroup();
    }
  }, [id]);

  const loadGroup = () => {
    try {
      const groupData = localStorage.getItem(`group_${id}`);
      if (groupData) {
        setGroup(JSON.parse(groupData));
      }
    } catch (err) {
      console.error('Error loading group:', err);
      setError('Fehler beim Laden der Gruppe');
    } finally {
      setLoading(false);
    }
  };

  const performDraw = async () => {
    if (!window.confirm('⚠️ WARNUNG: Das Auslosen kann NICHT rückgängig gemacht werden! Sicher fortfahren?')) {
      return;
    }

    setDrawing(true);
    setError('');

    try {
      const response = await fetch(`/api/draw/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: id }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Auslosung fehlgeschlagen');
      }

      const data = await response.json();

      // Save updated group with pairing to localStorage
      const updatedGroup = {
        ...group,
        drawn: true,
        pairing: data.pairing,
        drawnAt: new Date().toISOString(),
      };

      localStorage.setItem(`group_${id}`, JSON.stringify(updatedGroup));
      setGroup(updatedGroup);
      setSuccess(true);

      // Auto-redirect to dashboard after 3 seconds
      setTimeout(() => {
        router.push(`/organizer/${id}`);
      }, 3000);
    } catch (err) {
      console.error('Error performing draw:', err);
      setError(err.message || 'Fehler beim Auslosen');
    } finally {
      setDrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <p className="text-2xl text-gray-600">🔄 Lädt...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-gray-900 mb-4">❌ Gruppe nicht gefunden</p>
          <Link href="/">
            <a className="text-blue-600 hover:underline">← Zurück zur Startseite</a>
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50 flex items-center justify-center">
        <div className="text-center max-w-2xl">
          <div className="bg-white rounded-lg p-12 shadow-lg">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-4xl font-bold text-green-600 mb-4">Auslosung erfolgreich!</h1>
            <p className="text-xl text-gray-700 mb-8">
              Die Wichtel-Paarungen wurden generiert. Jeder Teilnehmer kann jetzt seinen Partner und dessen Wunschliste sehen!
            </p>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded mb-8 text-left">
              <p className="text-sm text-gray-700 mb-3">
                <strong>Was passiert jetzt:</strong>
              </p>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>✅ Alle Teilnehmer können die Gruppe öffnen und sehen, wen sie beschenken</li>
                <li>✅ Jeder sieht die Wunschliste des Partners mit Amazon-Links</li>
                <li>✅ Jeder kann direkt auf Amazon einkaufen</li>
                <li>✅ Du bekommst Affiliate-Provisionen für jeden Kauf!</li>
              </ul>
            </div>

            <p className="text-gray-600 mb-8">
              Leite deine Teilnehmer auf die Seite weiter, damit sie ihre Wichtel-Partner sehen können.
            </p>

            <Link href={`/organizer/${id}`}>
              <a className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition">
                ← Zum Dashboard zurück
              </a>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Show confirmation screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4 max-w-2xl">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <h1 className="text-4xl font-bold mb-6 text-center">🎲 Auslosung starten</h1>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
              ❌ Fehler: {error}
            </div>
          )}

          {/* Prerequisites Check */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded mb-8">
            <h2 className="text-xl font-bold text-blue-900 mb-4">✅ Checkliste vor Auslosung:</h2>
            <ul className="space-y-3 text-sm text-gray-700">
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Alle Teilnehmer haben sich angemeldet</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Alle Teilnehmer haben ihre Geschenkelisten eingegeben</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Alle Exclusions wurden gesetzt</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-green-600 font-bold mt-0.5">✓</span>
                <span>Auslosung kann NICHT rückgängig gemacht werden!</span>
              </li>
            </ul>
          </div>

          {/* Group Info */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-gray-50 rounded p-4">
              <p className="text-gray-600 text-sm font-semibold">Gruppe</p>
              <p className="text-2xl font-bold text-gray-900">{group.name}</p>
            </div>
            <div className="bg-gray-50 rounded p-4">
              <p className="text-gray-600 text-sm font-semibold">Teilnehmer</p>
              <p className="text-2xl font-bold text-gray-900">{group.participants?.length || 0}</p>
            </div>
          </div>

          {/* Participants List */}
          <div className="mb-8">
            <h3 className="font-bold text-gray-900 mb-3">📋 Teilnehmer die ausgelost werden:</h3>
            <div className="space-y-2">
              {group.participants && group.participants.length > 0 ? (
                group.participants.map((p) => (
                  <div key={p.id} className="bg-gray-50 p-3 rounded flex items-center gap-2">
                    <span className="text-blue-600">•</span>
                    <span className="font-medium text-gray-900">{p.name}</span>
                  </div>
                ))
              ) : (
                <p className="text-gray-500">Keine Teilnehmer</p>
              )}
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-8">
            <p className="text-red-900 font-bold mb-2">⚠️ WICHTIG:</p>
            <p className="text-sm text-red-800">
              Bitte stelle sicher, dass ALLE Teilnehmer ihre Geschenkelisten eingetragen haben, bevor du auslos! Diese Aktion kann nicht rückgängig gemacht werden.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Link href={`/organizer/${id}`}>
              <a className="flex-1 btn-outline text-center">
                ← Zurück
              </a>
            </Link>
            <button
              onClick={performDraw}
              disabled={drawing}
              className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
            >
              {drawing ? '🔄 Wird ausgelost...' : '🎲 Jetzt auslosen!'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
