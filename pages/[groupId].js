// pages/[groupId].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { getGroup, saveGroup as saveGroupToKV } from '../lib/kv';
import AddParticipants from '../components/AddParticipants';
import DrawNames from '../components/DrawNames';
import GiftList from '../components/GiftList';
import GiftGallery from '../components/GiftGallery';

export default function GroupPage() {
  const router = useRouter();
  const { groupId } = router.query;
  const [group, setGroup] = useState(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (groupId) {
      loadGroup();
    }
  }, [groupId]);

  const loadGroup = async () => {
    try {
      setLoading(true);
      setError('');

      let groupData = null;

      // Try KV first (primary)
      try {
        groupData = await getGroup(groupId);
        if (groupData) {
          console.log('✅ Group loaded from KV');
        }
      } catch (kvErr) {
        console.log('KV not available, trying API:', kvErr);
      }

      // Fallback to API
      if (!groupData) {
        try {
          const response = await fetch(`/api/groups/list?groupId=${groupId}`);
          if (response.ok) {
            const data = await response.json();
            if (data.groups && data.groups.length > 0) {
              groupData = data.groups[0];
              console.log('✅ Group loaded from API');
            }
          }
        } catch (apiErr) {
          console.error('API not available:', apiErr);
        }
      }

      if (groupData) {
        setGroup(groupData);
      } else {
        router.push('/');
        return;
      }

      // Check if already joined as participant (session only)
      const savedParticipant = localStorage.getItem(`participant_${groupId}`);
      if (savedParticipant) {
        setIsParticipant(true);
      }
    } catch (err) {
      console.error('Error loading group:', err);
      setError('Fehler beim Laden der Gruppe');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGroup = async (updated) => {
    try {
      // Save to KV (primary - no fallback)
      await saveGroupToKV(groupId, updated);
      console.log('✅ Group saved to KV');
      setGroup(updated);
    } catch (err) {
      console.error('❌ Failed to save group:', err);
      setError('Fehler beim Speichern. Bitte versuche es später erneut.');
    }
  };

  const joinAsParticipant = async () => {
    const name = prompt('Dein Name? (z.B. Max Mustermann)');
    if (name && name.trim()) {
      const newParticipant = { id: Date.now().toString(), name: name.trim(), email: null };
      const updated = {
        ...group,
        participants: [...group.participants, newParticipant],
      };
      await handleSaveGroup(updated);
      localStorage.setItem(`participant_${groupId}`, newParticipant.id);
      setIsParticipant(true);
      alert(`Willkommen, ${name.trim()}! Du bist jetzt Teil der Gruppe. Teile den Link weiter!`);
    } else {
      alert('Bitte einen Namen eingeben!');
    }
  };

  if (loading) return <p className="loading">🔄 Lade Gruppe...</p>;
  if (error) return <div className="container"><p className="text-red-600">{error}</p></div>;
  if (!group) return <p className="loading">Gruppe nicht gefunden</p>;

  return (
    <div className="container">
      {/* Header */}
      <div className="card bg-gradient-to-r from-red-500 to-green-500 text-white mb-6">
        <h1 className="text-4xl font-bold mb-2">🎄 {group.name}</h1>
        <p className="text-lg opacity-90">Budget: <strong>{group.budget}</strong> • Teilnehmer: <strong>{group.participants.length}</strong></p>
      </div>

      {/* Share Link */}
      <div className="card mb-6">
        <h3 className="font-semibold mb-2">🔗 Gruppen-Link teilen</h3>
        <div className="flex items-center gap-2">
          <code className="code flex-1">
            {typeof window !== 'undefined' ? `${window.location.origin}/${groupId}` : ''}
          </code>
          <button
            onClick={() => {
              const link = `${window.location.origin}/${groupId}`;
              navigator.clipboard.writeText(link);
              alert('Link kopiert!');
            }}
            className="btn-outline"
          >
            📋 Kopieren
          </button>
        </div>
      </div>

      {/* Participants List */}
      <div className="card mb-6 bg-blue-50">
        <h3 className="font-semibold mb-3">👥 Teilnehmer ({group.participants.length})</h3>
        {group.participants.length > 0 ? (
          <ul className="space-y-2">
            {group.participants.map(p => (
              <li key={p.id} className="bg-white p-2 rounded flex items-center gap-2">
                <span className="text-blue-500">✓</span>
                <span className="font-medium">{p.name}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">Noch keine Teilnehmer</p>
        )}
      </div>

      {/* Main Content */}
      {!isParticipant ? (
        <div className="join-section">
          <h3>🤝 Du bist noch nicht dabei!</h3>
          <p className="text-gray-700 mb-4">Klicke unten, um dich mit deinem Namen anzumelden. Kein Passwort nötig!</p>
          <button onClick={joinAsParticipant} className="join-button">
            An der Gruppe teilnehmen
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Organisator-Features */}
          {!group.drawn && (
            <>
              <AddParticipants group={group} saveGroup={handleSaveGroup} />
              <DrawNames group={group} saveGroup={handleSaveGroup} groupId={groupId} />
            </>
          )}

          {/* Nach Auslosung: Geschenkeliste & Galerie */}
          {group.drawn && isParticipant && (
            <div className="space-y-8">
              {/* Own Gift List */}
              <GiftList
                group={group}
                groupId={groupId}
                participantId={localStorage.getItem(`participant_${groupId}`)}
              />

              {/* Partner's Gift Gallery */}
              <GiftGallery
                group={group}
                groupId={groupId}
                participantId={localStorage.getItem(`participant_${groupId}`)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
