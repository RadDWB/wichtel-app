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
      const response = await fetch(`/api/draw/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler bei der Auslosung');
      }

      const data = await response.json();

      // Reload group data
      const groupResponse = await fetch(`/api/groups/${groupId}`);
      if (groupResponse.ok) {
        const updatedGroup = await groupResponse.json();
        saveGroup(updatedGroup);
      }

      alert('🎉 Auslosung erfolgreich! Jeder sieht nur sein Los.');
    } catch (err) {
      console.error('Error drawing names:', err);
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
          {error}
        </div>
      )}

      <button
        onClick={handleDraw}
        disabled={group.participants.length < 3 || loading}
        className="draw-button disabled:opacity-50"
      >
        {loading ? 'Wird ausgelost...' : 'Los geht\'s! 🎲'}
      </button>

      {group.participants.length < 3 && (
        <p className="text-gray-500 text-sm mt-2">
          Noch {3 - group.participants.length} Teilnehmer nötig
        </p>
      )}
    </div>
  );
}