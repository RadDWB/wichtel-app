// pages/[groupId].js
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AddParticipants from '../components/AddParticipants';
import DrawNames from '../components/DrawNames';
import Wishlist from '../components/Wishlist';

export default function GroupPage() {
  const router = useRouter();
  const { groupId } = router.query;
  const [group, setGroup] = useState(null);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    if (groupId) {
      const saved = localStorage.getItem(`group_${groupId}`);
      if (saved) {
        setGroup(JSON.parse(saved));
      } else {
        router.push('/');
      }

      // Prüfe, ob du schon als Teilnehmer angemeldet bist
      const savedParticipant = localStorage.getItem(`participant_${groupId}`);
      if (savedParticipant) {
        setIsParticipant(true);
      }
    }
  }, [groupId, router]);

  const saveGroup = (updated) => {
    localStorage.setItem(`group_${groupId}`, JSON.stringify(updated));
    setGroup(updated);
  };

  const joinAsParticipant = () => {
    const name = prompt('Dein Name? (z.B. Max Mustermann)');
    if (name && name.trim()) {
      const newParticipant = { id: Date.now().toString(), name: name.trim(), email: null };
      const updated = {
        ...group,
        participants: [...group.participants, newParticipant],
      };
      saveGroup(updated);
      localStorage.setItem(`participant_${groupId}`, newParticipant.id);
      setIsParticipant(true);
      alert(`Willkommen, ${name.trim()}! Du bist jetzt Teil der Gruppe. Teile den Link weiter!`);
    } else {
      alert('Bitte einen Namen eingeben!');
    }
  };

  if (!group) return <p className="loading">Lade Gruppe...</p>;

  return (
    <div className="container">
      <h1>{group.name}</h1>
      <p><strong>Budget:</strong> {group.budget}</p>
      <p><strong>Teilnehmer:</strong> {group.participants.length}</p>
      <p><strong>Gruppen-Link teilen:</strong> <code className="code">{typeof window !== 'undefined' ? `${window.location.origin}/${groupId}` : ''}</code></p>

      {!isParticipant ? (
        <div className="join-section">
          <h3>Du bist noch nicht dabei!</h3>
          <p>Klicke unten, um dich mit deinem Namen anzumelden. Kein Passwort nötig!</p>
          <button onClick={joinAsParticipant} className="join-button">An der Gruppe teilnehmen</button>
        </div>
      ) : (
        <>
          {/* Organisator-Features (immer sichtbar, aber nur nützlich für Ersteller) */}
          {!group.drawn && (
            <>
              <AddParticipants group={group} saveGroup={saveGroup} />
              <DrawNames group={group} saveGroup={saveGroup} />
            </>
          )}

          {/* Nach Auslosung: Wunschzettel */}
          {group.drawn && <Wishlist group={group} groupId={groupId} />}
        </>
      )}
    </div>
  );
}
