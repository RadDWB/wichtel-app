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
      setError('Bitte Produktname eingeben');
      return;
    }

    if (!newGift.link.trim()) {
      setError('Bitte Amazon-Link eingeben');
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to save gifts');
      }

      const data = await response.json();
      setGifts(data.gifts || updatedGifts);

      // Success message
      setTimeout(() => {
        setError(''); // Clear error after 3 seconds
      }, 3000);

    } catch (err) {
      console.error('Error adding gifts from browser:', err);
      setError(`❌ Fehler: ${err.message || 'Geschenke konnten nicht hinzugefügt werden. Bitte erneut versuchen.'}`);
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

      {/* Add Gift Manual Form */}
      <div className="card bg-green-50 border-l-4 border-green-500">
        <h3 className="section-title">🎁 Geschenk von Amazon hinzufügen</h3>
        <p className="text-gray-600 mb-4 text-sm">
          Maximal {10 - gifts.length} Geschenke mehr möglich (Budget: {group.budget})
        </p>

        {gifts.length < 10 ? (
          <div className="space-y-4">
            {/* How-To Guide */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <p className="font-semibold text-blue-900 mb-2">📋 So findest du den Link:</p>
              <ol className="text-sm text-blue-800 space-y-1 ml-4">
                <li>1️⃣ Gehe auf <a href="https://amazon.de" target="_blank" rel="noopener noreferrer" className="underline">amazon.de</a> und suche dein Produkt</li>
                <li>2️⃣ Öffne die Produktseite</li>
                <li>3️⃣ Kopiere die URL aus der Adressleiste (z.B. https://amazon.de/dp/B08N5WRWNW)</li>
                <li>4️⃣ Paste den Link unten ein und gib der Wunschliste einen Namen</li>
              </ol>
            </div>

            {/* Input Fields - Only Name and Link */}
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  📝 Produktname (was möchtest du?)
                </label>
                <input
                  type="text"
                  value={newGift.name}
                  onChange={e => setNewGift({ ...newGift, name: e.target.value })}
                  placeholder="z.B. AirPods Pro, Thermoskanne, Mystery-Buch"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  🔗 Amazon-Produktlink
                </label>
                <input
                  type="url"
                  value={newGift.link}
                  onChange={e => setNewGift({ ...newGift, link: e.target.value })}
                  placeholder="https://amazon.de/dp/B08N5WRWNW"
                  className="input-field font-mono text-xs"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 Tipp: Der Link kann auch gekürzt sein (z.B. amazon.de/gp/product/ASIN)
                </p>
              </div>

              <button
                onClick={addGift}
                disabled={loading}
                className="btn-secondary w-full disabled:opacity-50"
              >
                {loading ? '✨ Wird hinzugefügt...' : '✨ Geschenk zur Liste hinzufügen'}
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-yellow-50 border-l-4 border-yellow-500 p-3 rounded text-sm text-yellow-800">
              ℹ️ <strong>Hinweis:</strong> Der Affiliate-Link wird automatisch hinzugefügt, damit der Organisator eine kleine Provision erhält!
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
      </div>
    </div>
  );
}
