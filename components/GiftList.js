import { useState, useEffect } from 'react';

const AMAZON_AFFILIATE_TAG =
  process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'httpwwwspor03-21';

// Amazon Filter – jetzt mit Query-Fragmenten statt fertiger Links
const AMAZON_FILTERS = {
  price: [
    { label: '1-5 €', query: 'bis 5 Euro' },
    { label: '5-10 €', query: '5 bis 10 Euro' },
    { label: '10-15 €', query: '10 bis 15 Euro' },
    { label: '15-20 €', query: '15 bis 20 Euro' },
    { label: '20-30 €', query: '20 bis 30 Euro' },
    { label: '30-50 €', query: '30 bis 50 Euro' },
    { label: '50-100 €', query: '50 bis 100 Euro' },
    { label: '100+ €', query: 'über 100 Euro' },
  ],
  age: [
    { label: '👶 Baby (0-2 Jahre)', query: 'Baby Geschenk' },
    { label: '👧 Kind (3-7 Jahre)', query: 'Kinder 3-7 Jahre Geschenk' },
    { label: '🧒 Schulkind (8-12 Jahre)', query: 'Kinder 8-12 Jahre Geschenk' },
    { label: '👦 Teenager (13-17 Jahre)', query: 'Teenager Geschenk' },
    { label: '👨 Erwachsener (18-40 Jahre)', query: 'Geschenk für Erwachsene' },
    { label: '👩 Reifer (40-60 Jahre)', query: 'Geschenk für 40-60 Jährige' },
    { label: '👴 Senioren (über 60 Jahre)', query: 'Geschenk für Senioren' },
  ],
  gender: [
    { label: '👩 Weiblich', query: 'für Frauen' },
    { label: '👨 Männlich', query: 'für Männer' },
    { label: '❓ Egal', query: '' },
  ],
  category: [
    { label: '📚 Bücher & E-Reader', query: 'Bücher E-Reader' },
    { label: '🎮 Gaming & Konsolen', query: 'Gaming Konsole' },
    { label: '🎧 Audio & Kopfhörer', query: 'Kopfhörer Lautsprecher' },
    { label: '⌚ Uhren & Schmuck', query: 'Uhren Schmuck' },
    { label: '💻 Elektronik & Gadgets', query: 'Elektronik Gadget' },
    { label: '🏃 Sport & Outdoor', query: 'Sport Outdoor' },
    { label: '🧘 Beauty & Wellness', query: 'Beauty Wellness' },
    { label: '🍳 Haushalt & Küche', query: 'Haushalt Küche' },
  ],
};

// Baut zur Laufzeit eine echte Amazon-Suche:
// geschenkideen + Kategorie + Alter + Geschlecht + Budget
const buildAmazonSearchUrl = (price, category, age, gender) => {
  const base = 'https://www.amazon.de/s';
  const queryParts = ['geschenkideen'];

  if (category?.query) queryParts.push(category.query);
  if (age?.query) queryParts.push(age.query);
  if (gender?.query) queryParts.push(gender.query);
  if (price?.query) queryParts.push(price.query);

  const searchParams = new URLSearchParams();
  searchParams.set('k', queryParts.join(' '));
  searchParams.set('language', 'de_DE');
  searchParams.set('tag', AMAZON_AFFILIATE_TAG);

  return `${base}?${searchParams.toString()}`;
};

export default function GiftList({ group, groupId, participantId, isViewing = false }) {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedStep, setExpandedStep] = useState([1, 2]); // Start mit beiden Schritten offen
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [newGift, setNewGift] = useState({
    name: '',
    link: '',
    category: 'other',
    price: '',
  });

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

  // Preisempfehlung aus Budget ableiten
  const getRecommendedPrice = () => {
    if (!group?.budget) return AMAZON_FILTERS.price[2]; // 10–15 €

    const budget = String(group.budget).toLowerCase();

    if (budget.includes('5€') || budget === '5') return AMAZON_FILTERS.price[1];
    if (budget.includes('10€') || budget === '10') return AMAZON_FILTERS.price[2];
    if (budget.includes('15€') || budget === '15') return AMAZON_FILTERS.price[3];
    if (budget.includes('20€') || budget === '20') return AMAZON_FILTERS.price[4];
    if (budget.includes('30€') || budget === '30') return AMAZON_FILTERS.price[5];
    if (budget.includes('50€') || budget === '50') return AMAZON_FILTERS.price[6];
    if (budget.includes('100€') || budget === '100') return AMAZON_FILTERS.price[7];

    const budgetNum = parseInt(budget, 10);
    if (!isNaN(budgetNum)) {
      if (budgetNum <= 5) return AMAZON_FILTERS.price[0];
      if (budgetNum <= 10) return AMAZON_FILTERS.price[1];
      if (budgetNum <= 15) return AMAZON_FILTERS.price[2];
      if (budgetNum <= 20) return AMAZON_FILTERS.price[3];
      if (budgetNum <= 30) return AMAZON_FILTERS.price[4];
      if (budgetNum <= 50) return AMAZON_FILTERS.price[5];
      if (budgetNum <= 100) return AMAZON_FILTERS.price[6];
      return AMAZON_FILTERS.price[7];
    }

    return AMAZON_FILTERS.price[2];
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
      const response = await fetch(
        `/api/gifts/${groupId}?participantId=${participantId}`
      );
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

      if (affiliateLink && affiliateLink.includes('amazon.')) {
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
      setError(
        `❌ Fehler: ${
          err.message ||
          'Geschenk konnte nicht hinzugefügt werden. Bitte versuche es später erneut.'
        }`
      );
    } finally {
      setLoading(false);
    }
  };

  const removeGift = async (giftId) => {
    try {
      const updatedGifts = gifts.filter((g) => g.id !== giftId);

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
            {gifts.map((gift) => (
              <div
                key={gift.id}
                className="bg-white p-4 rounded-lg border border-gray-200 hover:shadow-md transition"
              >
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

  // Edit mode
  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* PHASE 1: AMAZON-FLOW (Akkordeon - Blau) */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border-2 border-blue-300 overflow-hidden shadow-md">
        <button
          onClick={() =>
            setExpandedStep(
              Array.isArray(expandedStep) && expandedStep.includes(1)
                ? expandedStep.filter((s) => s !== 1)
                : [...(Array.isArray(expandedStep) ? expandedStep : []), 1]
            )
          }
          className="w-full px-6 py-5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition flex items-center gap-3 text-left text-white"
        >
          <span className="flex-shrink-0 text-2xl">🔍</span>
          <div className="flex-1">
            <p className="font-bold text-lg">A) Produkt auf Amazon suchen</p>
            <p className="text-xs text-blue-100 mt-0.5">
              Budget + Kategorie + Alter + Geschlecht wählen & passende
              Geschenkideen finden
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

        {Array.isArray(expandedStep) && expandedStep.includes(1) && (
          <div className="px-6 py-6 bg-blue-50 border-t border-blue-200 space-y-4">
            <div className="bg-white p-4 rounded-lg border-l-4 border-blue-500 space-y-3 text-sm">
              <p className="font-semibold text-gray-900">📖 So funktioniert's:</p>
              <ol className="list-decimal list-inside space-y-2 ml-2 text-gray-700">
                <li>
                  Klick auf den Button unten „🔍 JETZT ZU AMAZON GEHEN“
                </li>
                <li>
                  Wähle eine <strong>Preisspanne (Budget)</strong> und auf Wunsch Kategorie,
                  Alter und Geschlecht
                </li>
                <li>
                  Wir bauen daraus eine <strong>gezielte Amazon-Suche</strong> mit allen
                  gewählten Filtern als Suchbegriffe
                </li>
                <li>
                  Auf Amazon suchst du dir ein Produkt aus und trägst es unten in deine
                  Wunschliste ein
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
                            <li>Produkt auf Amazon öffnen</li>
                            <li>
                              Teilen-Icon (Quadrat mit ↑) oben antippen
                            </li>
                            <li>
                              „Link kopieren“ auswählen
                            </li>
                            <li className="font-semibold text-green-700">
                              ✅ Link ist jetzt im Speicher
                            </li>
                            <li>Zurück in diese App</li>
                            <li>
                              Im Feld unten lange drücken → „Einfügen“
                            </li>
                          </ol>
                        </div>
                      ) : (
                        <div className="bg-white p-2 rounded text-gray-900">
                          <p className="font-semibold text-sm mb-2">
                            🤖 Android - So kopierst du den Link:
                          </p>
                          <ol className="list-decimal list-inside space-y-1 ml-1 text-xs">
                            <li>Produkt auf Amazon öffnen</li>
                            <li>
                              Adressleiste oben gedrückt halten
                            </li>
                            <li>
                              „Link kopieren“ / „URL kopieren“ wählen
                            </li>
                            <li className="font-semibold text-green-700">
                              ✅ Link ist jetzt im Speicher
                            </li>
                            <li>Zurück in diese App</li>
                            <li>
                              Im Feld unten lange drücken → „Einfügen“
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
                          <li>Produkt auf Amazon öffnen</li>
                          <li>
                            In die Adressleiste klicken
                          </li>
                          <li>
                            Strg+A / Cmd+A, dann Strg+C / Cmd+C
                          </li>
                          <li className="font-semibold text-green-700">
                            ✅ Link ist jetzt im Speicher
                          </li>
                          <li>
                            Unten im Feld Rechtsklick → „Einfügen“ oder Strg+V / Cmd+V
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

      {/* PHASE 2: GESCHENK EINTRAGEN */}
      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg border-2 border-green-300 overflow-hidden shadow-md">
        <button
          onClick={() =>
            setExpandedStep(
              Array.isArray(expandedStep) && expandedStep.includes(2)
                ? expandedStep.filter((s) => s !== 2)
                : [...(Array.isArray(expandedStep) ? expandedStep : []), 2]
            )
          }
          className="w-full px-6 py-5 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition flex items-center gap-3 text-left text-white"
        >
          <span className="flex-shrink-0 text-2xl">🎁</span>
          <div className="flex-1">
            <p className="font-bold text-lg">B) In Wunschliste übertragen</p>
            <p className="text-xs text-green-100 mt-0.5">
              Name + Amazon-Link eintragen
            </p>
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

        {Array.isArray(expandedStep) && expandedStep.includes(2) && (
          <div className="px-6 py-6 bg-green-50 border-t border-green-200 space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-gray-900">
                📝 Gib dem Geschenk einen Namen:
              </label>
              <input
                type="text"
                value={newGift.name}
                onChange={(e) =>
                  setNewGift({ ...newGift, name: e.target.value })
                }
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
                onChange={(e) =>
                  setNewGift({ ...newGift, link: e.target.value })
                }
                placeholder="https://www.amazon.de/…"
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-sm font-mono focus:border-green-500 focus:outline-none"
              />
              <p className="text-xs text-gray-600 mt-2">
                💡 Link einfach aus der Amazon-Adressleiste kopieren und hier
                einfügen.
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

      {/* FILTER MODAL – jetzt mit echtem Query-Build */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-4xl w-full my-8 shadow-2xl">
            <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold">
                🔍 Amazon Filter – Suche verfeinern
              </h3>
              <button
                onClick={() => setShowFiltersModal(false)}
                className="text-3xl font-bold hover:text-orange-200 transition"
              >
                ✕
              </button>
            </div>
            <div className="p-8 space-y-8 max-h-96 overflow-y-auto">
              {/* Preis */}
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 p-6 rounded-lg shadow-md">
                <div className="flex items-baseline gap-2 mb-4">
                  <h4 className="text-lg font-bold text-orange-900">
                    💰 SCHRITT 1: Budget wählen
                  </h4>
                  <span className="text-xs font-semibold text-white bg-green-500 px-2 py-0.5 rounded">
                    ✓ Vorausgewählt
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  Euer Gruppenbudget:{' '}
                  <strong>
                    {group?.budget ?? 'kein Budget eingetragen'}
                  </strong>
                </p>
                <p className="text-xs text-orange-700 bg-orange-100 p-2 rounded mb-4">
                  💡 Wir nutzen das Budget als Teil der Suchbegriffe (z.B.
                  „10 bis 15 Euro“), damit Amazon direkt passende Ergebnisse
                  zeigt.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {AMAZON_FILTERS.price.map((range) => (
                    <label
                      key={range.label}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition ${
                        selectedPrice?.label === range.label
                          ? 'bg-orange-600 border-orange-700 text-white shadow-md'
                          : 'bg-white border-gray-300 text-gray-900 hover:border-orange-400'
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
                      <span className="text-sm font-semibold">
                        {range.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Kategorie */}
              <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
                <div className="flex items-baseline gap-2 mb-4">
                  <h4 className="text-lg font-bold text-green-900">
                    🏷️ SCHRITT 2: Kategorie (optional)
                  </h4>
                  <span className="text-xs text-gray-600">
                    – Fließt mit als Suchbegriff in die Amazon-Suche ein
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
                          : 'bg-green-100 text-green-900 hover:bg-green-200'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alter */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <div className="flex items-baseline gap-2 mb-4">
                  <h4 className="text-lg font-bold text-blue-900">
                    👥 SCHRITT 3: Altersbereich (optional)
                  </h4>
                  <span className="text-xs text-gray-600">
                    – Wird in die Suche integriert (z.B. „Teenager Geschenk“)
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
                          : 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                      }`}
                    >
                      {age.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Geschlecht */}
              <div className="bg-purple-50 border-l-4 border-purple-400 p-4 rounded">
                <div className="flex items-baseline gap-2 mb-4">
                  <h4 className="text-lg font-bold text-purple-900">
                    👫 SCHRITT 4: Geschlecht (optional)
                  </h4>
                  <span className="text-xs text-gray-600">
                    – „für Frauen“ / „für Männer“ landet mit im Suchbegriff
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
                          : 'bg-purple-100 text-purple-900 hover:bg-purple-200'
                      }`}
                    >
                      {gender.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA */}
              <div className="space-y-4 pt-4">
                <button
                  onClick={() => {
                    const url = buildAmazonSearchUrl(
                      selectedPrice || getRecommendedPrice(),
                      selectedCategory,
                      selectedAge,
                      selectedGender
                    );
                    window.open(url, '_blank');
                    setShowFiltersModal(false);
                  }}
                  className="w-full py-5 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg font-bold text-xl transition shadow-lg transform hover:scale-105"
                >
                  🚀 AMAZON-SUCHE STARTEN
                </button>

                <p className="text-xs text-gray-600 text-center bg-gray-50 p-3 rounded">
                  💡 Wir bauen aus deinen Angaben eine Suchanfrage wie z.B.:{' '}
                  <span className="italic">
                    „geschenkideen Teenager Sport Outdoor 10 bis 15 Euro für
                    Männer“
                  </span>
                  . Du suchst dir ein Produkt aus und trägst es dann unten ein.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wunschliste */}
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
                    <h4 className="font-bold text-gray-900 truncate">
                      🎁 {gift.name}
                    </h4>
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
                    <p className="text-xs text-gray-500 italic">
                      Kein Link hinterlegt
                    </p>
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
            <p className="text-gray-500 italic">
              Noch keine Geschenke hinzugefügt
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Folge der Anleitung oben, um deine erste Wunschliste zu erstellen.
            </p>
          </div>
        )}
      </div>

      {gifts.length >= 10 && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
          <p className="text-sm text-green-900 font-semibold">
            ✅ Maximale Anzahl erreicht!
          </p>
          <p className="text-xs text-green-800 mt-1">
            Du hast die maximale Anzahl von 10 Geschenken erreicht!
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 py-4 space-y-1">
        <p>💚 Amazon-Links werden automatisch generiert, wir nehmen am Affiliate Programm teil!</p>
        <p className="text-gray-400">Wunschliste vdev2</p>
      </div>
    </div>
  );
}
