import { useState, useEffect } from 'react';

const AMAZON_AFFILIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'httpwwwspor03-21';

// Amazon Affiliate Links mit verschiedenen Preisranges
const AMAZON_PRICE_RANGES = [
  {
    label: '1-5 €',
    link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A100-500&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl'
  },
  {
    label: '5-10 €',
    link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A500-1000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl'
  },
  {
    label: '10-15 €',
    link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A1000-1500&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl'
  },
  {
    label: '15-20 €',
    link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A1500-2000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl'
  },
  {
    label: '20-30 €',
    link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A2000-3000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl'
  },
  {
    label: '30-50 €',
    link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A3000-5000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl'
  },
  {
    label: '50-100 €',
    link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A5000-10000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl'
  },
  {
    label: 'Alle Preise',
    link: 'https://www.amazon.de/s?k=geschenkideen&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl'
  }
];

export default function GiftList({ group, groupId, participantId, isViewing = false }) {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [newGift, setNewGift] = useState({
    name: '',
    link: '',
    category: 'other',
    price: '',
  });

  // Load gifts on mount
  useEffect(() => {
    loadGifts();
  }, [groupId, participantId]);

  const loadGifts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/gifts/${groupId}?participantId=${participantId}`);
      if (response.ok) {
        const data = await response.json();
        setGifts(data.gifts || []);
      }
    } catch (err) {
      console.error('Error loading gifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const addGift = async () => {
    if (!newGift.name.trim()) {
      setError('Bitte Produktname eingeben');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let affiliateLink = newGift.link.trim();

      // Add affiliate tag if Amazon link
      if (affiliateLink.includes('amazon.')) {
        try {
          const urlObj = new URL(affiliateLink);
          // Only add tag if not already present
          if (!urlObj.searchParams.has('tag')) {
            urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
            affiliateLink = urlObj.toString();
          }
        } catch (e) {
          // If URL parsing fails, use as-is
          console.warn('Could not parse Amazon URL:', e);
        }
      }

      const giftToAdd = {
        id: Date.now().toString(),
        name: newGift.name.trim(),
        link: affiliateLink,
        createdAt: new Date().toISOString(),
      };

      const updatedGifts = [...gifts, giftToAdd];

      // Save to backend
      const response = await fetch(`/api/gifts/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, gifts: updatedGifts }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      setGifts(data.gifts || updatedGifts);
      setNewGift({ name: '', link: '', category: 'other', price: '' });
      setError('✅ Geschenk erfolgreich hinzugefügt!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      console.error('Error adding gift:', err);
      setError(`❌ Fehler: ${err.message || 'Geschenk konnte nicht hinzugefügt werden. Bitte versuche es später erneut.'}`);
    } finally {
      setLoading(false);
    }
  };

  const removeGift = async (giftId) => {
    try {
      const updatedGifts = gifts.filter(g => g.id !== giftId);

      const response = await fetch(`/api/gifts/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, gifts: updatedGifts }),
      });

      if (!response.ok) throw new Error('Failed to delete gift');

      setGifts(updatedGifts);
    } catch (err) {
      console.error('Error deleting gift:', err);
      setError('Fehler beim Löschen');
    }
  };

  // Viewing mode - only show the gift list, nothing else
  if (isViewing) {
    return (
      <div className="space-y-4">
        {loading && <p className="text-center text-gray-500">Lädt...</p>}

        {gifts.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {gifts.map(gift => (
              <div key={gift.id} className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-2">🎁 {gift.name}</h4>
                    {gift.link && (
                      <a
                        href={gift.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline font-medium inline-flex items-center gap-2"
                      >
                        🔗 Auf Amazon anschauen
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 italic py-6">
            Keine Geschenke hinterlegt
          </p>
        )}
      </div>
    );
  }

  // Edit mode - show full form for adding gifts
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Add Gift Manual Form */}
      <div className="card bg-green-50 border-l-4 border-green-500">
        <h3 className="section-title">🎁 Geschenk hinzufügen</h3>
        <p className="text-gray-600 mb-6 text-sm">
          Maximal {10 - gifts.length} Geschenke mehr möglich (Budget: {group.budget})
        </p>

        {gifts.length < 10 ? (
          <div className="space-y-6">
            {/* Quick Amazon Links by Price - optional section */}
            <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-400 p-4 rounded">
              <p className="text-xs font-semibold text-orange-900 mb-3">🛍️ Für Amazon-Geschenke: Nutze diese vorfilterten Links für dein Budget ({group.budget}):</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {AMAZON_PRICE_RANGES.map((range) => (
                  <a
                    key={range.label}
                    href={range.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-orange-500 hover:bg-orange-600 text-white py-2 px-3 rounded font-semibold text-center transition"
                  >
                    {range.label}
                  </a>
                ))}
              </div>
              <p className="text-xs text-gray-600 mt-2">
                Wir nehmen am Amazon Affiliate Programm teil – Sie unterstützen uns durch Ihre Käufe! 🎁
              </p>
            </div>

            {/* Input Fields */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="font-semibold text-gray-800 mb-4">Füge ein Geschenk hinzu:</p>

              <div className="space-y-4">
                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    📝 Geschenk-Name:
                  </label>
                  <input
                    type="text"
                    value={newGift.name}
                    onChange={e => setNewGift({ ...newGift, name: e.target.value })}
                    placeholder="z.B. AirPods Pro, Thermoskanne, Mystery-Buch"
                    className="input-field w-full"
                  />
                </div>

                {/* Link Input - Optional */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    🔗 Amazon-Link (optional):
                  </label>
                  <input
                    type="url"
                    value={newGift.link}
                    onChange={e => setNewGift({ ...newGift, link: e.target.value })}
                    placeholder="https://amazon.de/dp/B08N5WRWNW"
                    className="input-field font-mono text-xs w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Du kannst auch ein Geschenk eintragen, ohne einen Link anzugeben!
                  </p>
                </div>

                {/* Button */}
                <button
                  onClick={addGift}
                  disabled={loading}
                  className="btn-secondary w-full disabled:opacity-50 mt-4"
                >
                  {loading ? '✨ Wird hinzugefügt...' : '✨ Geschenk hinzufügen'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600 font-semibold">
            ✅ Du hast die maximale Anzahl von 10 Geschenken erreicht!
          </p>
        )}
      </div>

      {/* Gift List */}
      <div className="card">
        <h3 className="section-title">
          📦 Deine Geschenkeliste ({gifts.length}/10)
        </h3>

        {gifts.length > 0 ? (
          <div className="grid grid-cols-1 gap-3">
            {gifts.map(gift => (
              <div key={gift.id} className="bg-gray-50 p-4 rounded-lg border-l-4 border-green-500 hover:bg-gray-100 transition">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h4 className="font-bold text-lg mb-2">🎁 {gift.name}</h4>
                    <div className="space-y-2">
                      {gift.link && (
                        <p>
                          <a
                            href={gift.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            🔗 Auf Amazon anschauen
                          </a>
                        </p>
                      )}
                      {!gift.link && (
                        <p className="text-sm text-gray-500 italic">Kein Link hinterlegt</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeGift(gift.id)}
                    className="btn-outline py-1 px-3 text-red-600 hover:bg-red-100 flex-shrink-0"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 italic py-6">
            Noch keine Geschenke hinzugefügt
          </p>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💚 Der Amazon-Link wird automatisch mit unserem Affiliate-Link verknüpft – der Organisator erhält eine kleine Provision!
          </p>
        </div>
      </div>
    </div>
  );
}
