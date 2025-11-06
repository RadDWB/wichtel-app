import { useState, useEffect } from 'react';

const AMAZON_AFFILIATE_TAG = "dein-affiliate-tag-21"; // ← Ersetze mit deinem!

export default function Wishlist({ group, groupId }) {
  const [participantId, setParticipantId] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [wish, setWish] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem(`wichtel_view_${groupId}`);
    if (saved) {
      setParticipantId(saved);
    } else {
      const name = prompt('Wie heißt du?');
      const participant = group.participants.find(p => p.name.toLowerCase() === name?.toLowerCase());
      if (participant) {
        localStorage.setItem(`wichtel_view_${groupId}`, participant.id);
        setParticipantId(participant.id);
      } else {
        alert('Teilnehmer nicht gefunden.');
      }
    }
  }, [groupId, group.participants]);

  if (!participantId) return <p>Lade...</p>;

  const participant = group.participants.find(p => p.id === participantId);
  const receiverId = group.pairing?.[participantId];
  const receiver = group.participants.find(p => p.id === receiverId);

  const addWish = () => {
    if (!wish.trim()) return;
    const isAmazon = wish.includes('amazon.de');
    const link = isAmazon ? `${wish.split('?')[0]}?tag=${AMAZON_AFFILIATE_TAG}` : wish;
    setWishlist([...wishlist, { text: wish, link }]);
    setWish('');
  };

  if (!receiver) return <p>Du bist der Organisator – warte auf die Auslosung.</p>;

  return (
    <div className="section">
      <h3>Du wichtelst: <strong>{receiver.name}</strong></h3>
      <p>Budget: {group.budget}</p>

      <h4>Deine Wunschliste (für deinen Wichtel):</h4>
      <div className="input-group">
        <input 
          value={wish} 
          onChange={e => setWish(e.target.value)} 
          placeholder="z.B. https://amazon.de/dp/B08N5WRWNW oder 'Socken'"
          onKeyPress={e => e.key === 'Enter' && addWish()}
        />
        <button onClick={addWish}>Hinzufügen</button>
      </div>

      <ul className="wishlist">
        {wishlist.map((w, i) => (
          <li key={i}>
            {w.link ? (
              <a href={w.link} target="_blank" rel="noopener noreferrer">
                {w.text}
              </a>
            ) : w.text}
          </li>
        ))}
      </ul>
    </div>
  );
}