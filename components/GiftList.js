import { useState, useEffect } from 'react';
import { GIFT_CATEGORIES } from '../lib/categories';
import GiftIdeaBrowser from './GiftIdeaBrowser';

const AMAZON_AFFILIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'httpwwwspor03-21';

export default function GiftList({ group, groupId, participantId }) {
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
      setError('Bitte Geschenkname eingeben');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let affiliateLink = newGift.link;

      // Add affiliate tag if Amazon link
      if (newGift.link && newGift.link.includes('amazon.')) {
        try {
          const urlObj = new URL(newGift.link);
          urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
          affiliateLink = urlObj.toString();
        } catch (e) {
          // If URL parsing fails, use as-is
          affiliateLink = newGift.link;
        }
      }

      const giftToAdd = {
        id: Date.now().toString(),
        name: newGift.name.trim(),
        link: affiliateLink,
        category: newGift.category,
        price: newGift.price || '',
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
        throw new Error('Failed to save gift');
      }

      setGifts(updatedGifts);
      setNewGift({ name: '', link: '', category: 'other', price: '' });
    } catch (err) {
      console.error('Error adding gift:', err);
      setError('Fehler beim Hinzufügen. Bitte versuche es später erneut.');
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

  const addGiftsFromIdeaBrowser = async (selectedGifts) => {
    try {
      setLoading(true);
      setError('');

      // Konvertiere Geschenke zu Geschenk-Format
      const newGifts = selectedGifts.map(gift => {
        // Affiliate-Tag hinzufügen, falls Amazon-Link
        let link = gift.link;
        if (gift.link && gift.link.includes('amazon.')) {
          try {
            const urlObj = new URL(gift.link);
            if (!urlObj.searchParams.has('tag')) {
              urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
              link = urlObj.toString();
            }
          } catch (e) {
            // URL-Parsing fehlgeschlagen, verwende wie vorhanden
          }
        }

        return {
          id: Date.now().toString() + Math.random(),
          name: gift.name,
          link: link,
          category: 'other',
          price: gift.price + '€',
          createdAt: new Date().toISOString(),
        };
      });

      // Prüfe max 10 Limit
      if (gifts.length + newGifts.length > 10) {
        const canAdd = 10 - gifts.length;
        setError(`Du kannst maximal ${canAdd} weitere Geschenke hinzufügen!`);
        setLoading(false);
        return;
      }

      const updatedGifts = [...gifts, ...newGifts];

      // Speichere auf Backend
      const response = await fetch(`/api/gifts/${groupId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participantId, gifts: updatedGifts }),
      });

      if (!response.ok) {
        throw new Error('Failed to save gifts');
      }

      setGifts(updatedGifts);
    } catch (err) {
      console.error('Error adding gifts from browser:', err);
      setError('Fehler beim Hinzufügen der Geschenke');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Gift Idea Browser - nur wenn noch Platz vorhanden */}
      {gifts.length < 10 && (
        <GiftIdeaBrowser
          budget={group?.budget}
          onSelectGifts={addGiftsFromIdeaBrowser}
        />
      )}

      {/* Add Gift Form */}
      <div className="card bg-green-50 border-l-4 border-green-500">
        <h3 className="section-title">🎁 Geschenk hinzufügen</h3>
        <p className="text-gray-600 mb-4 text-sm">
          Maximal {10 - gifts.length} Geschenke mehr möglich (Budget: {group.budget})
        </p>

        {gifts.length < 10 ? (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Geschenk-Name</label>
              <input
                type="text"
                value={newGift.name}
                onChange={e => setNewGift({ ...newGift, name: e.target.value })}
                placeholder="z.B. AirPods Pro, Thermoskanne, Buch"
                className="input-field"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Kategorie</label>
                <select
                  value={newGift.category}
                  onChange={e => setNewGift({ ...newGift, category: e.target.value })}
                  className="input-field"
                >
                  {GIFT_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Preis (optional)</label>
                <input
                  type="text"
                  value={newGift.price}
                  onChange={e => setNewGift({ ...newGift, price: e.target.value })}
                  placeholder="z.B. 49€"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Amazon-Link (optional)</label>
              <input
                type="url"
                value={newGift.link}
                onChange={e => setNewGift({ ...newGift, link: e.target.value })}
                placeholder="https://amazon.de/dp/B08N5WRWNW"
                className="input-field"
              />
            </div>

            <button
              onClick={addGift}
              disabled={loading}
              className="btn-secondary w-full disabled:opacity-50"
            >
              {loading ? 'Wird hinzugefügt...' : '✨ Geschenk hinzufügen'}
            </button>
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
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{GIFT_CATEGORIES.find(c => c.id === gift.category)?.emoji || '✨'}</span>
                      <h4 className="font-bold text-lg">{gift.name}</h4>
                    </div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><strong>Kategorie:</strong> {GIFT_CATEGORIES.find(c => c.id === gift.category)?.label}</p>
                      {gift.price && <p><strong>Preis:</strong> {gift.price}</p>}
                      {gift.link && (
                        <p>
                          <strong>Link:</strong>{' '}
                          <a href={gift.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            Auf Amazon anschauen
                          </a>
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => removeGift(gift.id)}
                    className="btn-outline py-1 px-3 text-red-600 hover:bg-red-100"
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
      </div>
    </div>
  );
}
