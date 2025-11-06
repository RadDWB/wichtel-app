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

      // Prüfen, ob User schon Teilnehmer ist
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
    const name = prompt('🎄 Dein Name für die Wichtelrunde?');
    if (!name || !name.trim()) {
      alert('Bitte einen Namen eingeben!');
      return;
    }
    const trimmedName = name.trim();
    // Doppelten Namen verhindern
    if (group.participants.some(p => p.name.toLowerCase() === trimmedName.toLowerCase())) {
      alert('Dieser Name ist schon vergeben!');
      return;
    }
    const newParticipant = { id: Date.now().toString(), name: trimmedName, email: null };
    const updated = {
      ...group,
      participants: [...group.participants, newParticipant],
    };
    saveGroup(updated);
    localStorage.setItem(`participant_${groupId}`, newParticipant.id);
    setIsParticipant(true);
    alert(`Willkommen, ${trimmedName}! 🎉 Du bist jetzt dabei!`);
  };

  if (!group) return <p className="loading">Lade Gruppe...</p>;

  return (
    <div className="container">
      <h1>🎄 {group.name}</h1>
      <p><strong>Budget:</strong> {group.budget}</p>
      <p><strong>Teilnehmer:</strong> {group.participants.length}</p>

      {/* Neue Teilnehmer-Anmeldung */}
      {!isParticipant ? (
        <div className="join-section">
          <h3>Du bist noch nicht dabei!</h3>
          <p>Klick unten und tritt der Wichtelrunde bei – nur ein Name nötig!</p>
          <button onClick={joinAsParticipant} className="join-button">
            Jetzt teilnehmen! 🎅
          </button>
        </div>
      ) : (
        <>
          {/* Organisator-Ansicht */}
          {!group.drawn ? (
            <>
              <AddParticipants group={group} saveGroup={saveGroup} />
              <DrawNames group={group} saveGroup={saveGroup} />
            </>
          ) : (
            <Wishlist group={group} groupId={groupId} />
          )}
        </>
      )}
    </div>
  );
}
