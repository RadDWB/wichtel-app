import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useRouter } from 'next/router';

export default function CreateGroup({ onGroupCreated }) {
  const [groupName, setGroupName] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const id = uuidv4().slice(0, 8);
      const group = {
        id,
        name: groupName || 'Meine Wichtelrunde',
        budget: budget || '20 €',
        participants: [],
        exclusions: {},
        drawn: false,
        pairing: null,
        createdAt: new Date().toISOString(),
      };

      // Save to Vercel KV
      const response = await fetch(`/api/groups/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(group),
      });

      if (!response.ok) {
        throw new Error('Failed to create group');
      }

      // Group saved to KV via API
      onGroupCreated(id);
      router.push(`/${id}`);
    } catch (err) {
      console.error('Error creating group:', err);
      setError('Fehler beim Erstellen der Gruppe. Bitte versuche es später erneut.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form max-w-md mx-auto">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      <div>
        <label className="block text-sm font-medium mb-2">Gruppenname (optional)</label>
        <input
          type="text"
          placeholder="z.B. Weihnachtswichteln 2024"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          className="input-field"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">Max. Budget</label>
        <input
          type="text"
          placeholder="z.B. 20 €"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="input-field"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-50"
      >
        {loading ? 'Wird erstellt...' : 'Gruppe anlegen'}
      </button>
    </form>
  );
}