import { useState } from 'react';

export default function DrawNames({ group, saveGroup, groupId }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDraw = async () => {
    if (group.participants.length < 3) {
      setError('Mindestens 3 Teilnehmer nötig!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🎲 Starting draw for group:', groupId);
      console.log('Participants:', group.participants);
      console.log('Exclusions:', group.exclusions);

      // First, try to save the group to make sure it's in KV
      await saveGroup(group);
      console.log('✅ Group saved to KV');

      const response = await fetch(`/api/draw/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      console.log('API Response status:', response.status);
      const responseData = await response.json();
      console.log('API Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || 'Fehler bei der Auslosung');
      }

      console.log('✅ Draw successful');

      // Save the updated group with pairing
      if (responseData.group) {
        console.log('✅ Saving group with pairing from API response');
        saveGroup(responseData.group);
      } else {
        // Fallback: create updated group locally
        console.warn('⚠️ No group in response, creating locally');
        const localUpdated = { ...group, drawn: true, pairing: responseData.pairing };
        saveGroup(localUpdated);
      }

      alert('🎉 Auslosung erfolgreich! Jetzt können alle ihre Los sehen. Bitte teile diese Nachricht mit allen Teilnehmern:\n\n"Schaut auf den Link, um zu sehen, wen ihr wichtelt!"');
    } catch (err) {
      console.error('❌ Error drawing names:', err);
      setError('Fehler: ' + (err.message || 'Bitte versuche es später erneut.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card bg-purple-50 border-l-4 border-purple-500">
      <h3 className="section-title">🎲 Namen auslosen</h3>
      <p className="text-gray-600 mb-4">
        Alle {group.participants.length} Teilnehmer sind angemeldet. Jetzt geht's los!
      </p>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Fehler:</strong> {error}
          <p className="text-sm mt-2">Bitte versuche es später erneut oder kontaktiere den Support.</p>
        </div>
      )}

      <button
        onClick={handleDraw}
        disabled={group.participants.length < 3 || loading}
        className="draw-button disabled:opacity-50"
      >
        {loading ? '🔄 Wird ausgelost...' : '🎲 Los geht\'s!'}
      </button>

      {group.participants.length < 3 && (
        <p className="text-gray-500 text-sm mt-2">
          ⏳ Noch {3 - group.participants.length} Teilnehmer nötig
        </p>
      )}

      {group.participants.length >= 3 && !group.drawn && (
        <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-3 rounded text-sm">
          <p className="text-green-700">
            ✅ <strong>Bereit!</strong> Alle {group.participants.length} Teilnehmer sind angemeldet.
            Klicke "Los geht's" um die Auslosung zu starten.
          </p>
        </div>
      )}
    </div>
  );
}