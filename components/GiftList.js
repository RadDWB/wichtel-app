import { useState, useEffect } from 'react';
import { APP_VERSION } from '../lib/constants';

const AMAZON_AFFILIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'httpwwwspor03-21';

// Amazon Filter Kategorien
const AMAZON_FILTERS = {
  price: [
    { label: '1-5 €', link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A100-500&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl' },
    { label: '5-10 €', link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A500-1000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl' },
    { label: '10-15 €', link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A1000-1500&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl' },
    { label: '15-20 €', link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A1500-2000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl' },
    { label: '20-30 €', link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A2000-3000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl' },
    { label: '30-50 €', link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A3000-5000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl' },
    { label: '50-100 €', link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A5000-10000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl' },
    { label: '100+ €', link: 'https://www.amazon.de/s?k=geschenkideen&rh=p_price%3A10000&linkCode=ll2&tag=httpwwwspor03-21&linkId=352789827e8ff4245765ad12811dd59f&language=de_DE&ref_=as_li_ss_tl' },
  ],
  age: [
    { label: '👶 Baby (0-2 Jahre)', link: 'https://www.amazon.de/s?k=baby+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '👧 Kind (3-7 Jahre)', link: 'https://www.amazon.de/s?k=kinder+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '🧒 Schulkind (8-12 Jahre)', link: 'https://www.amazon.de/s?k=schulkinder+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '👦 Teenager (13-17 Jahre)', link: 'https://www.amazon.de/s?k=teenager+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '👨 Erwachsener (18-40 Jahre)', link: 'https://www.amazon.de/s?k=erwachsenen+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '👩 Reifer (40-60 Jahre)', link: 'https://www.amazon.de/s?k=geschenke+für+reife+erwachsene&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '👴 Senioren (über 60 Jahre)', link: 'https://www.amazon.de/s?k=senioren+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
  ],
  gender: [
    { label: '👩 Weiblich', link: 'https://www.amazon.de/s?k=geschenke+für+frauen&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '👨 Männlich', link: 'https://www.amazon.de/s?k=geschenke+für+männer&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '❓ Egal', link: 'https://www.amazon.de/s?k=geschenkideen&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
  ],
  category: [
    { label: '📚 Bücher & E-Reader', link: 'https://www.amazon.de/s?k=bücher+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '🎮 Gaming & Konsolen', link: 'https://www.amazon.de/s?k=gaming+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '🎧 Audio & Kopfhörer', link: 'https://www.amazon.de/s?k=kopfhörer+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '⌚ Uhren & Schmuck', link: 'https://www.amazon.de/s?k=uhren+schmuck+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '💻 Elektronik & Gadgets', link: 'https://www.amazon.de/s?k=elektronik+gadgets+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '🏃 Sport & Outdoor', link: 'https://www.amazon.de/s?k=sport+outdoor+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '🧘 Beauty & Wellness', link: 'https://www.amazon.de/s?k=beauty+wellness+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
    { label: '🍳 Haushalt & Küche', link: 'https://www.amazon.de/s?k=haushalt+küche+geschenke&linkCode=ll2&tag=httpwwwspor03-21&language=de_DE&ref_=as_li_ss_tl' },
  ]
};

export default function GiftList({ group, groupId, participantId, isViewing = false }) {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedStep, setExpandedStep] = useState([1, 2]);  // Start mit beiden Schritten offen
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [newGift, setNewGift] = useState({ name: '', link: '', category: 'other', price: '' });

  // Filter selection states
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showLinkHelp, setShowLinkHelp] = useState(false);

  // Mobile & OS detection
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  // Helper function to auto-detect price from group budget
  const getRecommendedPrice = () => {
    if (!group?.budget) return AMAZON_FILTERS.price[2]; // Default zu 10-15 €

    const budget = group.budget.toLowerCase();

    // Map common budget values to price ranges
    if (budget.includes('5€') || budget === '5') return AMAZON_FILTERS.price[1]; // 5-10 €
    if (budget.includes('10€') || budget === '10') return AMAZON_FILTERS.price[2]; // 10-15 €
    if (budget.includes('15€') || budget === '15') return AMAZON_FILTERS.price[3]; // 15-20 €
    if (budget.includes('20€') || budget === '20') return AMAZON_FILTERS.price[4]; // 20-30 €
    if (budget.includes('30€') || budget === '30') return AMAZON_FILTERS.price[5]; // 30-50 €
    if (budget.includes('50€') || budget === '50') return AMAZON_FILTERS.price[6]; // 50-100 €
    if (budget.includes('100€') || budget === '100') return AMAZON_FILTERS.price[7]; // 100+ €

    // Fallback: try to find first price range that fits
    const budgetNum = parseInt(budget);
    if (!isNaN(budgetNum)) {
      if (budgetNum <= 5) return AMAZON_FILTERS.price[0]; // 1-5 €
      if (budgetNum <= 10) return AMAZON_FILTERS.price[1]; // 5-10 €
      if (budgetNum <= 15) return AMAZON_FILTERS.price[2]; // 10-15 €
      if (budgetNum <= 20) return AMAZON_FILTERS.price[3]; // 15-20 €
      if (budgetNum <= 30) return AMAZON_FILTERS.price[4]; // 20-30 €
      if (budgetNum <= 50) return AMAZON_FILTERS.price[5]; // 30-50 €
      if (budgetNum <= 100) return AMAZON_FILTERS.price[6]; // 50-100 €
      return AMAZON_FILTERS.price[7]; // 100+ €
    }

    return AMAZON_FILTERS.price[2]; // Default zu 10-15 €
  };

  // Detect mobile and OS on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent;
      const mobile = /iPhone|iPad|iPod|Android/i.test(ua);
      const ios = /iPhone|iPad|iPod/i.test(ua);
      const android = /Android/i.test(ua);

      setIsMobile(mobile);
      setIsIOS(ios);
      setIsAndroid(android);
    }
  }, []);

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

      if (affiliateLink.includes('amazon.')) {
        try {
          const urlObj = new URL(affiliateLink);
          if (!urlObj.searchParams.has('tag')) {
            urlObj.searchParams.set('tag', AMAZON_AFFILIATE_TAG);
            affiliateLink = urlObj.toString();
          }
        } catch (e) {
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

  // Viewing mode
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
          <p className="text-center text-gray-500 italic py-6">Keine Geschenke hinterlegt</p>
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* PHASE 1: AMAZON-FLOW (Akkordeon - Blau) */}
      {/* ════════════════════════════════════════════════════════ */}

      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 overflow-hidden shadow-md">
        {/* Header - Immer sichtbar */}
        <button
          onClick={() =>
            setExpandedStep(
              Array.isArray(expandedStep) && expandedStep.includes(1)
                ? expandedStep.filter(s => s !== 1)
                : [...(Array.isArray(expandedStep) ? expandedStep : []), 1]
            )
          }
          className="w-full px-6 py-5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition flex items-center gap-3 text-left text-white"
        >
          <span className="flex-shrink-0 text-2xl">🔍</span>
          <div className="flex-1">
            <p className="font-bold text-lg">A) Produkt auf Amazon suchen</p>
            <p className="text-xs text-blue-100 mt-0.5">
              Budget wählen & Artikel auf Amazon anschauen
            </p>
          </div>
          <span
            className="text-xl text-blue-100"
            style={{
              transform:
                Array.isArray(expandedStep) && expandedStep.includes(1)
                  ? 'rotate(180deg)'
                  : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
        </button>

        {/* Content */}
        {Array.isArray(expandedStep) && expandedStep.includes(1) && (
          <div className="px-6 py-6 bg-blue-50 border-t border-blue-200 space-y-4">
            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 space-y-3 text-sm">
              <p className="font-semibold text-gray-900">📖 So funktioniert's:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
                <li>Klick auf den Button unten „🔍 JETZT ZU AMAZON GEHEN“</li>
                <li>
                  Wähle eine <strong>Preisspanne (Budget)</strong>, die zu eurer Wichtel-Runde passt
                </li>
                <li>Schau dir Bilder, Beschreibung, Rezensionen und Preis an</li>
                <li>
                  Passt der Artikel zu deinem Budget? Dann füge ihn der Liste hinzu!
                </li>
              </ol>

              <div className="text-xs text-blue-600 mt-3 bg-blue-100 p-3 rounded space-y-2">
                <p
                  className="font-semibold flex items-center justify-between cursor-pointer hover:text-blue-800"
                  onClick={() => setShowLinkHelp(!showLinkHelp)}
                >
                  💡 Link kopieren
                  <span
                    style={{
                      transform: showLinkHelp ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                    }}
                    className="ml-2"
                  >
                    ▼
                  </span>
                </p>

                {showLinkHelp && (
                  <div className="mt-2 pt-2 border-t border-blue-300 space-y-3">
                    {isMobile ? (
                      isIOS ? (
                        <div className="bg-white p-2 rounded text-gray-900">
                          <p className="font-semibold text-sm mb-2">
                            📱 iPhone - So kopierst du den Link:
                          </p>
                          <ol className="list-decimal list-inside space-y-1 ml-1 text-xs">
                            <li>Schau dir das Produkt auf Amazon an</li>
                            <li>
                              Oben rechts: Tippe auf das <strong>[Teilen-Icon]</strong> (Quadrat
                              mit ↑)
                            </li>
                            <li>
                              Im Menü: Scroll nach unten und wähle{' '}
                              <strong>"Link kopieren"</strong>
                            </li>
                            <li className="font-semibold text-green-700">
                              ✅ Link ist jetzt im Speicher!
                            </li>
                            <li>Komm zurück zu dieser App</li>
                            <li>
                              Im Feld unten: Tippe lange → <strong>"Einfügen"</strong>
                            </li>
                          </ol>
                        </div>
                      ) : (
                        <div className="bg-white p-2 rounded text-gray-900">
                          <p className="font-semibold text-sm mb-2">
                            🤖 Android - So kopierst du den Link:
                          </p>
                          <ol className="list-decimal list-inside space-y-1 ml-1 text-xs">
                            <li>Schau dir das Produkt auf Amazon an</li>
                            <li>
                              Halte die <strong>URL-Adressleiste</strong> oben kurz gedrückt
                            </li>
                            <li>
                              Im Popup-Menü: Wähle <strong>"Link kopieren"</strong> oder{' '}
                              <strong>"URL kopieren"</strong>
                            </li>
                            <li className="font-semibold text-green-700">
                              ✅ Link ist jetzt im Speicher!
                            </li>
                            <li>Komm zurück zu dieser App</li>
                            <li>
                              Im Feld unten: Tippe lange → <strong>"Einfügen"</strong>
                            </li>
                          </ol>
                        </div>
                      )
                    ) : (
                      <div className="bg-white p-2 rounded text-gray-900">
                        <p className="font-semibold text-sm mb-2">
                          🖥️ Desktop/Laptop - So kopierst du den Link:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 ml-1 text-xs">
                          <li>Schau dir das Produkt auf Amazon an</li>
                          <li>
                            Klick in die <strong>Adressleiste</strong> oben (wo die URL steht)
                          </li>
                          <li>
                            Wähle alles: <strong>Strg+A</strong> (Windows) /{' '}
                            <strong>Cmd+A</strong> (Mac)
                          </li>
                          <li>
                            Kopieren: <strong>Strg+C</strong> (Windows) /{' '}
                            <strong>Cmd+C</strong> (Mac)
                          </li>
                          <li className="font-semibold text-green-700">
                            ✅ Link ist jetzt im Speicher!
                          </li>
                          <li>
                            Im Feld unten: Rechtsklick → <strong>"Einfügen"</strong> oder{' '}
                            <strong>Strg+V</strong> / <strong>Cmd+V</strong>
                          </li>
                        </ol>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                // Auto-detect price from budget and reset optional filters
                setSelectedPrice(getRecommendedPrice());
                setSelectedAge(null);
                setSelectedGender(null);
                setSelectedCategory(null);
                setShowFiltersModal(true);
              }}
              className="w-full py-4 px-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-bold text-lg transition shadow-lg flex items-center justify-center gap-2"
            >
              🔍 JETZT ZU AMAZON GEHEN →
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* PHASE 2: GESCHENK EINTRAGEN (Akkordeon - Grün) */}
      {/* ════════════════════════════════════════════════════════ */}

      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-2 border-green-300 overflow-hidden shadow-md">
        {/* Header - Immer sichtbar */}
        <button
          onClick={() =>
            setExpandedStep(
              Array.isArray(expandedStep) && expandedStep.includes(2)
                ? expandedStep.filter(s => s !== 2)
                : [...(Array.isArray(expandedStep) ? expandedStep : []), 2]
            )
          }
          className="w-full px-6 py-5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition flex items-center gap-3 text-left text-white"
        >
          <span className="flex-shrink-0 text-2xl">🎁</span>
          <div className="flex-1">
            <p className="font-bold text-lg">B) In Wunschliste übertragen</p>
            <p className="text-xs text-green-100 mt-0.5">Name + Amazon-Link eintragen</p>
          </div>
          <span
            className="text-xl text-green-100"
            style={{
              transform:
                Array.isArray(expandedStep) && expandedStep.includes(2)
                  ? 'rotate(180deg)'
                  : 'rotate(0deg)',
            }}
          >
            ▼
          </span>
        </button>

        {/* Content */}
        {Array.isArray(expandedStep) && expandedStep.includes(2) && (
          <div className="px-6 py-6 bg-green-50 border-t border-green-200 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">
                📝 Gib dem Geschenk einen Namen:
              </label>
              <input
                type="text"
                value={newGift.name}
                onChange={e => setNewGift({ ...newGift, name: e.target.value })}
                placeholder="z.B. AirPods Pro, Thermoskanne, Mystery-Buch"
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-sm focus:border-green-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">
                🔗 Amazon-Link (optional):
              </label>
              <input
                type="url"
                value={newGift.link}
                onChange={e => setNewGift({ ...newGift, link: e.target.value })}
                placeholder="https://amazon.de/dp/B08N5WRWNW"
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-sm font-mono focus:border-green-500 focus:outline-none"
              />
              <p className="text-xs text-gray-600 mt-2">
                💡 Link einfach aus der Amazon-Adressleiste kopieren und hier einfügen
              </p>
            </div>

            <button
              onClick={addGift}
              disabled={loading || !newGift.name.trim()}
              className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
              {loading ? '⏳ Wird hinzugefügt...' : '✨ Hinzufügen'}
            </button>
          </div>
        )}
      </div>

      {/* FILTER MODAL */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8 shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold">🔍 Amazon Filter - Finde das perfekte Geschenk</h3>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="text-3xl font-bold hover:text-orange-200 transition"
              >
                ✕
              </button>
            </div>
            <div className="p-8 space-y-8 max-h-96 overflow-y-auto">
              {/* STAGE 1: PRICE SELECTION */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 p-6 rounded-lg shadow-md">
                <div className="flex items-baseline gap-2 mb-4">
                  <h4 className="text-lg font-bold text-orange-900">💰 SCHRITT 1: Budget wählen</h4>
                  <span className="text-xs font-semibold text-white bg-green-500 px-2 py-0.5 rounded">
                    ✓ Vorausgewählt
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  Dein Gruppenbudget:{' '}
                  <strong>{group?.budget ?? 'kein Budget eingetragen'}</strong>
                </p>
                <p className="text-xs text-orange-700 bg-orange-100 p-2 rounded mb-4">
                  💡 Basierend auf deinem Budget haben wir eine Preisspanne vorausgewählt. Du kannst
                  aber auch eine andere wählen!
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {AMAZON_FILTERS.price.map((range) => (
                    <label
                      key={range.label}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition ${
                        selectedPrice?.label === range.label
                          ? 'bg-orange-200 border-orange-600 shadow-md'
                          : 'bg-white border-gray-300 hover:border-orange-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="price"
                        value={range.label}
                        checked={selectedPrice?.label === range.label}
                        onChange={() => setSelectedPrice(range)}
                        className="w-4 h-4 accent-orange-500"
                      />
                      <span className="text-sm font-semibold text-gray-900">{range.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* STAGE 2: OPTIONALE gedankliche Filter (nur zur Inspiration) */}
              {selectedPrice && (
                <>
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                    <div className="flex items-baseline gap-2 mb-4">
                      <h4 className="text-lg font-bold text-green-900">
                        🏷️ SCHRITT 2: Kategorie (optional)
                      </h4>
                      <span className="text-xs text-gray-600">
                        — Nur zur Orientierung, der Amazon-Link nutzt dein Budget
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AMAZON_FILTERS.category.map((cat) => (
                        <button
                          key={cat.label}
                          onClick={() => setSelectedCategory(cat)}
                          className={`text-sm py-3 px-3 rounded font-semibold text-center transition ${
                            selectedCategory?.label === cat.label
                              ? 'bg-green-600 text-white ring-2 ring-green-300'
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                    <div className="flex items-baseline gap-2 mb-4">
                      <h4 className="text-lg font-bold text-blue-900">
                        👥 SCHRITT 3: Altersbereich (optional)
                      </h4>
                      <span className="text-xs text-gray-600">
                        — Nur als Hilfe beim Überlegen
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {AMAZON_FILTERS.age.map((age) => (
                        <button
                          key={age.label}
                          onClick={() => setSelectedAge(age)}
                          className={`text-sm py-3 px-3 rounded font-semibold text-center transition ${
                            selectedAge?.label === age.label
                              ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {age.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
                    <div className="flex items-baseline gap-2 mb-4">
                      <h4 className="text-lg font-bold text-purple-900">
                        👫 SCHRITT 4: Geschlecht (optional)
                      </h4>
                      <span className="text-xs text-gray-600">
                        — Hilft bei der Auswahl, beeinflusst aber den Link nicht
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {AMAZON_FILTERS.gender.map((gender) => (
                        <button
                          key={gender.label}
                          onClick={() => setSelectedGender(gender)}
                          className={`text-sm py-3 px-3 rounded font-semibold text-center transition ${
                            selectedGender?.label === gender.label
                              ? 'bg-purple-600 text-white ring-2 ring-purple-300'
                              : 'bg-purple-500 hover:bg-purple-600 text-white'
                          }`}
                        >
                          {gender.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CALL-TO-ACTION */}
                  <div className="space-y-4 pt-4">
                    <button
                      onClick={() => {
                        const targetLink = selectedPrice?.link;
                        if (targetLink) {
                          window.open(targetLink, '_blank');
                          setShowFiltersModal(false);
                        }
                      }}
                      className="w-full py-5 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg font-bold text-xl transition shadow-lg transform hover:scale-105"
                    >
                      🚀 LOS GEHT'S ZU AMAZON!
                    </button>

                    <p className="text-xs text-gray-600 text-center bg-gray-50 p-3 rounded">
                      💡 Amazon öffnet sich mit deiner gewählten{' '}
                      <strong>Preisspanne (Budget)</strong>. Dort kannst du nach passenden
                      Geschenkideen suchen und den Link kopieren.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* GESCHENKELISTE */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
          <h3 className="font-bold text-gray-900 text-lg">
            📦 Deine Geschenkeliste ({gifts.length}/10)
          </h3>
        </div>

        {gifts.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {gifts.map((gift, index) => (
              <div
                key={gift.id}
                className="p-4 hover:bg-gray-50 transition flex justify-between items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-gray-900 truncate">🎁 {gift.name}</h4>
                  </div>
                  {gift.link ? (
                    <a
                      href={gift.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline block truncate"
                    >
                      🔗 Amazon Link anschauen →
                    </a>
                  ) : (
                    <p className="text-xs text-gray-500 italic">Kein Link hinterlegt</p>
                  )}
                </div>
                <button
                  onClick={() => removeGift(gift.id)}
                  className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                  title="Löschen"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 italic">Noch keine Geschenke hinzugefügt</p>
            <p className="text-xs text-gray-400 mt-2">
              Folge der Anleitung oben, um deine erste Wunschliste zu erstellen
            </p>
          </div>
        )}
      </div>

      {gifts.length >= 10 && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-sm text-green-900 font-semibold">✅ Maximale Anzahl erreicht!</p>
          <p className="text-xs text-green-800 mt-1">
            Du hast die maximale Anzahl von 10 Geschenken erreicht.
          </p>
        </div>
      )}

      {/* FUSSZEILE */}
      <div className="text-center text-xs text-gray-500 py-4 space-y-1">
        <p>💚 Amazon-Links werden automatisch mit unserem Affiliate-Link verknüpft</p>
        <p className="text-gray-400">Wunschliste v{APP_VERSION}</p>
      </div>
    </div>
  );
}
