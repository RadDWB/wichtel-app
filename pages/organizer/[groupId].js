import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { OCCASIONS } from '../../lib/occasions';

export default function OrganizerDashboard() {
  const router = useRouter();
  const { groupId } = router.query;
  const [group, setGroup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (groupId) {
      loadGroup();
    }
  }, [groupId]);

  const loadGroup = () => {
    try {
      setLoading(true);
      const saved = localStorage.getItem(`group_${groupId}`);
      if (saved) {
        setGroup(JSON.parse(saved));
        const link = `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${groupId}`;
        setShareLink(link);
      }
    } catch (err) {
      console.error('Error loading group:', err);
      setError('Fehler beim Laden der Gruppe');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCompleteGroup = () => {
    if (window.confirm('Möchtest du die Anmeldephase abschließen? Danach können keine neuen Teilnehmer mehr beitreten.')) {
      const updated = { ...group, isComplete: true };
      localStorage.setItem(`group_${groupId}`, JSON.stringify(updated));
      setGroup(updated);
      alert('✅ Gruppe abgeschlossen! Teilnehmer können jetzt ihre Geschenkelisten bearbeiten.');
    }
  };

  const handleDraw = async () => {
    if (!group.isComplete) {
      alert('⏳ Bitte schließe erst die Anmeldephase ab');
      return;
    }

    try {
      const response = await fetch(`/api/draw/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const result = await response.json();

        // Update group with pairing from response
        const updated = {
          ...group,
          drawn: true,
          pairing: result.pairing,
          drawnAt: new Date().toISOString(),
        };

        localStorage.setItem(`group_${groupId}`, JSON.stringify(updated));
        setGroup(updated);
        alert('🎉 Auslosung erfolgreich! Jeder sieht nur sein Los.');
      } else {
        const error = await response.json();
        alert('Fehler: ' + (error.error || 'Auslosung fehlgeschlagen'));
      }
    } catch (err) {
      console.error('Error:', err);

      // Fallback: do draw in localStorage if API fails
      try {
        const { drawNames } = require('../../utils/drawAlgorithm');
        const pairing = drawNames(group.participants, group.exclusions || {});
        const updated = {
          ...group,
          drawn: true,
          pairing,
          drawnAt: new Date().toISOString(),
        };
        localStorage.setItem(`group_${groupId}`, JSON.stringify(updated));
        setGroup(updated);
        alert('🎉 Auslosung erfolgreich (Fallback-Modus)! Jeder sieht nur sein Los.');
      } catch (fallbackErr) {
        console.error('Fallback error:', fallbackErr);
        alert('Fehler bei der Auslosung: ' + err.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-2xl">🔄 Lädt...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-white text-2xl">❌ Gruppe nicht gefunden</p>
      </div>
    );
  }

  const occasion = OCCASIONS.find(o => o.id === group.occasion);
  const participantCount = group.participants?.length || 0;
  const readyCount = group.participants?.filter(p => {
    const gifts = localStorage.getItem(`group:${groupId}:gifts:${p.id}`);
    return !!gifts && JSON.parse(gifts).length > 0;
  }).length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-red-50">
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="mb-8">
          <a href="/" className="text-red-600 hover:underline mb-4 inline-block">
            ← Zurück zur Startseite
          </a>
          <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-8 shadow-lg">
            <h1 className="text-4xl font-bold mb-2">{occasion?.label} {group.name}</h1>
            <p className="text-lg opacity-90">Organisiert von: <strong>{group.organizerName}</strong></p>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg p-6 border-l-4 border-blue-500">
            <p className="text-gray-600 text-sm">Teilnehmer</p>
            <p className="text-3xl font-bold text-gray-900">{participantCount}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border-l-4 border-green-500">
            <p className="text-gray-600 text-sm">Mit Geschenkelisten</p>
            <p className="text-3xl font-bold text-gray-900">{readyCount}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border-l-4 border-orange-500">
            <p className="text-gray-600 text-sm">Budget</p>
            <p className="text-3xl font-bold text-gray-900">{group.budget}</p>
          </div>
          <div className="bg-white rounded-lg p-6 border-l-4 border-purple-500">
            <p className="text-gray-600 text-sm">Status</p>
            <p className="text-xl font-bold">
              {group.drawn ? '✅ Ausgelost' : group.isComplete ? '⏳ Bereit' : '📝 Offen'}
            </p>
          </div>
        </div>

        {/* Share Link */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-8 border-l-4 border-red-500">
          <h2 className="text-2xl font-bold mb-4">🔗 Teilnehmer einladen</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 bg-gray-100 px-4 py-2 rounded-lg border border-gray-300"
            />
            <button
              onClick={copyLink}
              className="btn-primary"
            >
              {copied ? '✅ Kopiert!' : '📋 Kopieren'}
            </button>
          </div>
          <p className="text-sm text-gray-600">
            Teile diesen Link per Email, WhatsApp, SMS oder jeder anderen App mit deinen Freunden.
          </p>
        </div>

        {/* Participants List */}
        <div className="bg-white rounded-lg p-6 shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4">👥 Teilnehmer</h2>
          {group.participants && group.participants.length > 0 ? (
            <div className="space-y-3">
              {group.participants.map((p) => {
                const hasGifts = localStorage.getItem(`group:${groupId}:gifts:${p.id}`);
                return (
                  <div key={p.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border-l-4 border-blue-400">
                    <div>
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      {p.email && <p className="text-sm text-gray-500">{p.email}</p>}
                    </div>
                    <div className="text-right">
                      {hasGifts ? (
                        <p className="text-green-600 font-semibold">✅ Geschenkeliste</p>
                      ) : (
                        <p className="text-gray-500 text-sm">⏳ Wartet...</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600">Noch keine Teilnehmer</p>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-4">
          {!group.isComplete && (
            <button
              onClick={handleCompleteGroup}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-bold py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition"
            >
              ✅ Anmeldephase abschließen
            </button>
          )}

          {group.isComplete && !group.drawn && (
            <button
              onClick={handleDraw}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold py-3 rounded-lg hover:from-purple-700 hover:to-purple-800 transition"
            >
              🎲 Jetzt auslosen!
            </button>
          )}

          {group.drawn && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-6 py-4 rounded-lg">
              <p className="font-semibold">✅ Auslosung erfolgreich!</p>
              <p className="text-sm mt-1">Jeder Teilnehmer kann jetzt die Geschenkeliste seines Partners sehen.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
