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

      // Reload group data from KV
      const groupResponse = await fetch(`/api/groups/${groupId}`);
      if (groupResponse.ok) {
        const updatedGroup = await groupResponse.json();
        console.log('✅ Loaded updated group from KV');
        saveGroup(updatedGroup);
      } else {
        console.warn('⚠️ Could not reload group from API, using local state');
        const localUpdated = { ...group, drawn: true };
        saveGroup(localUpdated);
      }

      alert('🎉 Auslosung erfolgreich! Jeder sieht nur sein Los. Bitte seite neu laden.');
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