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
  const [showAmazonModal, setShowAmazonModal] = useState(false);
  const [expandedStep, setExpandedStep] = useState([1, 2]);  // Changed: Start with both step 1 and 2 expanded
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [newGift, setNewGift] = useState({ name: '', link: '', category: 'other', price: '' });

  // Filter selection states
  const [selectedPrice, setSelectedPrice] = useState(null);
  const [selectedAge, setSelectedAge] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Mobile & OS detection
  const [isMobile, setIsMobile] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

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
                      <a href={gift.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium inline-flex items-center gap-2">
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

  // Edit mode - COMPLETELY REDESIGNED
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* PHASE 1: ANLEITUNG & AMAZON-FLOW (Akkordeon - Blau) */}
      {/* ════════════════════════════════════════════════════════ */}
      
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 overflow-hidden shadow-md">
        {/* Header - Immer sichtbar */}
        <button
          onClick={() => setExpandedStep(Array.isArray(expandedStep) && expandedStep.includes(1) ? expandedStep.filter(s => s !== 1) : [...(Array.isArray(expandedStep) ? expandedStep : []), 1])}
          className="w-full px-6 py-5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition flex items-center gap-3 text-left text-white"
        >
          <span className="flex-shrink-0 text-2xl">📖</span>
          <div className="flex-1">
            <p className="font-bold text-lg">So funktioniert's - 3 einfache Schritte</p>
            <p className="text-xs text-blue-100 mt-0.5">Lies das BEVOR du zu Amazon gehst!</p>
          </div>
          <span className="text-xl text-blue-100" style={{transform: (Array.isArray(expandedStep) && expandedStep.includes(1)) ? 'rotate(180deg)' : 'rotate(0deg)'}}>▼</span>
        </button>

        {/* Content */}
        {(Array.isArray(expandedStep) && expandedStep.includes(1)) && (
          <div className="px-6 py-6 bg-blue-50 border-t border-blue-200 space-y-4">
            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">A</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Auf Amazon.de gehen</p>
                  <p className="text-sm text-gray-700 mt-1">Klick unten auf den großen Button \"Zu Amazon gehen\" und nutze die Filter, um das perfekte Geschenk zu finden. Denke dabei an die Vorlieben der Person!</p>
                  <p className="text-xs text-blue-600 mt-2 bg-blue-100 p-2 rounded">💡 Tipp: Nutze die vorgegebenen Filter (Alter, Geschlecht, Budget) um schneller zu finden</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">B</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Produkt auswählen & erkunden</p>
                  <p className="text-sm text-gray-700 mt-1">Schau Dir die Bilder, Beschreibung, Rezensionen und den Preis an. Passt es zu Deinem Budget?</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">C</div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900">Link kopieren & zurückkommen</p>
                  <p className="text-sm text-gray-700 mt-1">Kopiere die URL und komm zurück zu dieser App um den Geschenk-Link einzutragen.</p>
                  <div className="text-xs text-blue-600 mt-2 bg-blue-100 p-3 rounded space-y-2">
                    {isMobile ? (
                      isIOS ? (
                        <>
                          <p className="font-semibold">📱 iPhone - So kopierst du den Link:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-1">
                            <li>Tippe oben rechts auf das <strong>[Teilen-Icon]</strong> (Pfeil im Quadrat)</li>
                            <li>Wähle <strong>"Link kopieren"</strong></li>
                            <li>Wechsel zur Wichtel-App und füge den Link ein</li>
                          </ol>
                        </>
                      ) : (
                        <>
                          <p className="font-semibold">🤖 Android - So kopierst du den Link:</p>
                          <ol className="list-decimal list-inside space-y-1 ml-1">
                            <li>Tippe lange (3 Sekunden) auf die <strong>URL in der Adresszeile</strong></li>
                            <li>Wähle <strong>"Link kopieren"</strong> oder <strong>"URL kopieren"</strong></li>
                            <li>Wechsel zur Wichtel-App und füge den Link ein</li>
                          </ol>
                        </>
                      )
                    ) : (
                      <>
                        <p className="font-semibold">🖥️ Desktop - So kopierst du den Link:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-1">
                          <li>Klick in die <strong>Adresszeile</strong> oben im Browser</li>
                          <li>Drücke <strong>Strg+A (Windows)</strong> oder <strong>Cmd+A (Mac)</strong> um alles zu markieren</li>
                          <li>Drücke <strong>Strg+C (Windows)</strong> oder <strong>Cmd+C (Mac)</strong> zum Kopieren</li>
                          <li>Füge den Link unten bei \"Amazon-Link\" ein</li>
                        </ol>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowFiltersModal(true)}
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
          onClick={() => setExpandedStep(Array.isArray(expandedStep) && expandedStep.includes(2) ? expandedStep.filter(s => s !== 2) : [...(Array.isArray(expandedStep) ? expandedStep : []), 2])}
          className="w-full px-6 py-5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition flex items-center gap-3 text-left text-white"
        >
          <span className="flex-shrink-0 text-2xl">🎁</span>
          <div className="flex-1">
            <p className="font-bold text-lg">Geschenk hier eintragen</p>
            <p className="text-xs text-green-100 mt-0.5">Name + Link (Link ist optional!)</p>
          </div>
          <span className="text-xl text-green-100" style={{transform: (Array.isArray(expandedStep) && expandedStep.includes(2)) ? 'rotate(180deg)' : 'rotate(0deg)'}}>▼</span>
        </button>

        {/* Content */}
        {(Array.isArray(expandedStep) && expandedStep.includes(2)) && (
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

      {/* FILTER MODAL - SCHRITT 1 - REORGANISIERT */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8 shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold">🔍 Amazon Filter - Finde das perfekte Geschenk</h3>
              <button onClick={() => setShowFiltersModal(false)} className="text-3xl font-bold hover:text-orange-200 transition">
                ✕
              </button>
            </div>
            <div className="p-8 space-y-6 max-h-96 overflow-y-auto">
              {/* CATEGORY FILTER - OBEN */}
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <h4 className="text-lg font-bold text-green-900 mb-4">🏷️ Nach Kategorie (optional):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-2">
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

              {/* AGE FILTER */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <h4 className="text-lg font-bold text-blue-900 mb-4">👥 Nach Altersbereich (optional):</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-2">
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

              {/* GENDER FILTER */}
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
                <h4 className="text-lg font-bold text-purple-900 mb-4">👫 Nach Geschlecht (optional):</h4>
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

              {/* BUDGET FILTER - UNTEN - INITIIERT DEN LINK */}
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded border-2 border-orange-300">
                <h4 className="text-lg font-bold text-orange-900 mb-4">💰 Nach Budget ({group.budget}) - Wähle um zu Amazon zu gehen:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {AMAZON_FILTERS.price.map((range) => (
                    <a
                      key={range.label}
                      href={range.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setShowFiltersModal(false)}
                      className="text-sm bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white py-3 px-2 rounded font-bold text-center transition shadow-md"
                    >
                      {range.label}
                    </a>
                  ))}
                </div>
              </div>

              <p className="text-sm text-gray-600 text-center bg-gray-100 p-4 rounded">
                💡 Wähle optional Kategorie, Alter und Geschlecht, dann klick auf einen Preis um zur Amazon.de Geschenke-Übersicht zu gehen!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AMAZON SHOPPING MODAL */}
      {showAmazonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-orange-500 text-white p-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">🛍️ Amazon Filter - Schnelle Links</h3>
              <button onClick={() => setShowAmazonModal(false)} className="text-2xl font-bold hover:text-orange-200 transition">
                ✕
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-700 mb-6">
                Klick auf einen Link, um auf Amazon zu gehen und nach Produkten in deinem Budget zu suchen:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {AMAZON_FILTERS.price.map((range) => (
                  <a key={range.label} href={range.link} target="_blank" rel="noopener noreferrer" onClick={() => setShowAmazonModal(false)} className="text-sm bg-orange-500 hover:bg-orange-600 text-white py-3 px-2 rounded font-semibold text-center transition">
                    {range.label}
                  </a>
                ))}
              </div>
              <p className="text-xs text-gray-600 text-center">
                💡 Die Links öffnen Amazon mit vordefinierten Filtern für Geschenkideen
              </p>
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
              <div key={gift.id} className="p-4 hover:bg-gray-50 transition flex justify-between items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-gray-900 truncate">🎁 {gift.name}</h4>
                  </div>
                  {gift.link && (
                    <a href={gift.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline block truncate">
                      🔗 Amazon Link anschauen →
                    </a>
                  )}
                  {!gift.link && (
                    <p className="text-xs text-gray-500 italic">Kein Link hinterlegt</p>
                  )}
                </div>
                <button onClick={() => removeGift(gift.id)} className="flex-shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition" title="Löschen">
                  🗑️
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-gray-500 italic">Noch keine Geschenke hinzugefügt</p>
            <p className="text-xs text-gray-400 mt-2">Folge der Anleitung oben, um deine erste Wunschliste zu erstellen</p>
          </div>
        )}
      </div>

      {gifts.length >= 10 && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-sm text-green-900 font-semibold">✅ Maximale Anzahl erreicht!</p>
          <p className="text-xs text-green-800 mt-1">Du hast die maximale Anzahl von 10 Geschenken erreicht.</p>
        </div>
      )}

      {/* FUSSZEILE */}
      <div className="text-center text-xs text-gray-500 py-4 space-y-1">
        <p>💚 Amazon-Links werden automatisch mit unserem Affiliate-Link verknüpft</p>
        <p className="text-gray-400">Wunschliste v1.0</p>
      </div>
    </div>
  );
}
