import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import AddParticipants from '../components/AddParticipants';
import DrawNames from '../components/DrawNames';
import Wishlist from '../components/Wishlist';

export default function GroupPage() {
  const router = useRouter();
  const { groupId } = router.query;
  const [group, setGroup] = useState(null);

  useEffect(() => {
    if (groupId) {
      const saved = localStorage.getItem(`group_${groupId}`);
      if (saved) {
        setGroup(JSON.parse(saved));
      } else {
        router.push('/');
      }
    }
  }, [groupId, router]);

  const saveGroup = (updated) => {
    localStorage.setItem(`group_${groupId}`, JSON.stringify(updated));
    setGroup(updated);
  };

  if (!group) return <p className="loading">Lade Gruppe...</p>;

  return (
    <div className="container">
      <h1>{group.name}</h1>
      <p><strong>Budget:</strong> {group.budget}</p>
      <p><strong>Teilnehmer:</strong> {group.participants.length}</p>

      {!group.drawn ? (
        <>
          <AddParticipants group={group} saveGroup={saveGroup} />
          <DrawNames group={group} saveGroup={saveGroup} />
        </>
      ) : (
        <Wishlist group={group} groupId={groupId} />
      )}
    </div>
  );
}