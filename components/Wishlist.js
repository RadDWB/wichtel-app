import { useState, useEffect } from 'react';

const AMAZON_AFFILIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "wichtel-app-21";

export default function Wishlist({ group, groupId }) {
  const [participantId, setParticipantId] = useState(null);
  const [wishlist, setWishlist] = useState([]);
  const [wish, setWish] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadWishlist = async () => {
      const saved = localStorage.getItem(`wichtel_view_${groupId}`);
      if (saved) {
        setParticipantId(saved);
        // Load from backend
        try {
          const response = await fetch(`/api/wishlist/${groupId}?participantId=${saved}`);
          if (response.ok) {
            const data = await response.json();
            setWishlist(data.wishlist || []);
          }
        } catch (err) {
          console.error('Error loading wishlist:', err);
        }
      } else {
        const name = prompt('Wie heißt du?');
        const participant = group.participants.find(p => p.name.toLowerCase() === name?.toLowerCase());
        if (participant) {
          localStorage.setItem(`wichtel_view_${groupId}`, participant.id);
          setParticipantId(participant.id);
          // Load from backend
          try {
            const response = await fetch(`/api/wishlist/${groupId}?participantId=${participant.id}`);
            if (response.ok) {
              const data = await response.json();
              setWishlist(data.wishlist || []);
            }
          } catch (err) {
            console.error('Error loading wishlist:', err);
          }
        } else {
          alert('Teilnehmer nicht gefunden.');
        }
      }
    };

    if (group.participants.length > 0) {
      loadWishlist();
    }
  }, [groupId, group.participants]);

  const addWish = async () => {
    if (!wish.trim()) return;

    setLoading(true);
    setError('');

    try {
      const isAmazon = wish.includes('amazon.');
      let link = wish;

      if (isAmazon) {
        const urlObj = new URL(wish);
        urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
        link = urlObj.toString();
      }

      const newWishlist = [...wishlist, { text: wish, link }];

      // Save to backend
      const response = await fetch(`/api/wishlist/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, wishlist: newWishlist }),
      });

      if (!response.ok) {
        throw new Error('Failed to save wishlist');
      }

      setWishlist(newWishlist);
      setWish('');
    } catch (err) {
      console.error('Error adding wish:', err);
      setError('Fehler beim Hinzufügen des Wunsches. Bitte versuche es später erneut.');
    } finally {
      setLoading(false);
    }
  };

  if (!participantId) return <p className="loading">Lade...</p>;

  const participant = group.participants.find(p => p.id === participantId);
  const receiverId = group.pairing?.[participantId];
  const receiver = group.participants.find(p => p.id === receiverId);

  if (!receiver) return (
    <div className="card bg-yellow-50 border-l-4 border-yellow-500">
      <h3 className="text-yellow-700 font-bold">Auslosung läuft noch</h3>
      <p>Du bist der Organisator – warte auf die Auslosung.</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-red-50 to-green-50 border-l-4 border-red-500">
        <h2 className="text-2xl font-bold mb-2">🎁 Du wichtelst: <span className="text-red-600">{receiver.name}</span></h2>
        <p className="text-gray-600">Budget: <strong>{group.budget}</strong></p>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="card">
        <h3 className="section-title">Deine Wunschliste</h3>
        <p className="text-gray-600 mb-4">Teile Amazon-Links oder freie Wünsche mit deinem Wichtel!</p>

        <div className="input-group mb-4">
          <input
            value={wish}
            onChange={e => setWish(e.target.value)}
            placeholder="z.B. https://amazon.de/dp/B08N5WRWNW oder 'Socken'"
            className="input-field"
            onKeyPress={e => e.key === 'Enter' && addWish()}
          />
          <button
            onClick={addWish}
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? '...' : 'Hinzufügen'}
          </button>
        </div>

        {wishlist.length > 0 ? (
          <ul className="wishlist">
            {wishlist.map((w, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="text-red-500 mt-1">•</span>
                {w.link ? (
                  <a
                    href={w.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-red-600 hover:text-red-700 font-medium break-all"
                  >
                    {w.text}
                  </a>
                ) : (
                  <span className="text-gray-700">{w.text}</span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">Noch keine Wünsche hinzugefügt</p>
        )}
      </div>
    </div>
  );
}