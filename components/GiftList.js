import { useState, useEffect } from 'react';
import { GIFT_CATEGORIES } from '../lib/categories';
import GiftIdeaBrowser from './GiftIdeaBrowser';

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

      {/* Gift Idea Browser - nur wenn noch Platz vorhanden */}
      {gifts.length < 10 && (
        <GiftIdeaBrowser
          budget={group?.budget}
          onSelectGifts={addGiftsFromIdeaBrowser}
        />
      )}

      {/* Add Gift Manual Form */}
      <div className="card bg-green-50 border-l-4 border-green-500">
        <h3 className="section-title">🎁 Eigenes Amazon-Produkt hinzufügen</h3>
        <p className="text-gray-600 mb-6 text-sm">
          Maximal {10 - gifts.length} Geschenke mehr möglich (Budget: {group.budget})
        </p>

        {gifts.length < 10 ? (
          <div className="space-y-6">
            {/* Step 1 */}
            <div className="border-b pb-6">
              <div className="flex gap-3 mb-3">
                <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                <p className="font-semibold text-gray-800">Gehe auf <a href="https://amazon.de" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-bold">amazon.de</a></p>
              </div>
              <p className="text-sm text-gray-600 ml-11 mb-4">
                Suche dein Wunschprodukt. Du kannst die Amazon-Filter nutzen, um den Preis auf dein Budget ({group.budget}) zu begrenzen.
              </p>

              {/* Quick Amazon Links by Price */}
              <div className="ml-11 bg-gradient-to-r from-orange-50 to-yellow-50 border-l-4 border-orange-400 p-4 rounded">
                <p className="text-xs font-semibold text-orange-900 mb-3">💡 Oder nutze diese vorfilterten Links für dein Budget:</p>
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
                  Alle Käufe über diese Links unterstützen uns! 🎁
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="border-b pb-6">
              <div className="flex gap-3 mb-3">
                <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                <p className="font-semibold text-gray-800">Wähle dein Produkt aus</p>
              </div>
              <p className="text-sm text-gray-600 ml-11">
                Klicke auf das Produkt, das dir gefällt, und öffne die Produktseite.
              </p>
            </div>

            {/* Step 3 */}
            <div className="border-b pb-6">
              <div className="flex gap-3 mb-3">
                <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                <p className="font-semibold text-gray-800">Kopiere den Link</p>
              </div>
              <p className="text-sm text-gray-600 ml-11 mb-3">
                Markiere die URL in der Adresszeile deines Browsers und kopiere sie. Beispiel:
              </p>
              <p className="text-xs bg-gray-200 rounded p-2 ml-11 font-mono mb-2">
                https://amazon.de/dp/B08N5WRWNW
              </p>
              <p className="text-xs text-blue-600 ml-11 mt-3">
                📱 <strong>Mobile-Tipp:</strong> In der Amazon-App kannst du auch die „Teilen"-Funktion nutzen, um den Link zu kopieren!
              </p>
            </div>

            {/* Step 4 - Input Fields */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
              <div className="flex gap-3 mb-4">
                <span className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">4</span>
                <p className="font-semibold text-gray-800">Trage den Link und Namen hier ein</p>
              </div>

              <div className="space-y-4 ml-11">
                {/* Link Input */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    🔗 Kopiere den Link unten ein:
                  </label>
                  <input
                    type="url"
                    value={newGift.link}
                    onChange={e => setNewGift({ ...newGift, link: e.target.value })}
                    placeholder="https://amazon.de/dp/B08N5WRWNW"
                    className="input-field font-mono text-xs w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    💡 Der Link kann auch gekürzt sein (z.B. amazon.de/gp/product/ASIN)
                  </p>
                </div>

                {/* Name Input */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    📝 Gib dem Geschenk einen aussagekräftigen Namen:
                  </label>
                  <input
                    type="text"
                    value={newGift.name}
                    onChange={e => setNewGift({ ...newGift, name: e.target.value })}
                    placeholder="z.B. AirPods Pro, Thermoskanne, Mystery-Buch"
                    className="input-field w-full"
                  />
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
