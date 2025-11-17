import { useState, useEffect } from 'react';
import { getAllGiftCategories } from '../lib/giftIdeas';

// Category to search keywords mapping
const CATEGORY_KEYWORDS = {
  tech: 'Technik Gadgets Elektronik',
  lifestyle: 'Lifestyle Fashion Accessoires',
  books: 'Buch eBook Sachbuch Roman',
  home: 'Wohndeko Heimdekoration Einrichtung',
  sports: 'Sport Fitness Training',
  drinks: 'Drinks Getränke Kaffee Tee',
};

export default function GiftIdeaBrowser({ budget, onSelectGifts }) {
  const [step, setStep] = useState(1); // 1: Kategorie, 2: Geschlecht, 3: Anzahl & Auswahl
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [giftCount, setGiftCount] = useState(10);
  const [selectedGifts, setSelectedGifts] = useState({});
  const [loading, setLoading] = useState(false);
  const [availableGifts, setAvailableGifts] = useState([]);
  const [searchError, setSearchError] = useState('');

  const categories = getAllGiftCategories();

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setStep(2);
  };

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
    setStep(3);
    setSelectedGifts({});
    // Automatically load products when gender is selected
    loadProducts(gender);
  };

  const loadProducts = async (gender) => {
    if (!selectedCategory || !gender) return;

    setLoading(true);
    setSearchError('');
    setAvailableGifts([]);

    try {
      // Extract numeric budget value (e.g., "30 €" -> 30)
      const budgetValue = parseFloat(String(budget).replace(/[^0-9.,]/g, '').replace(',', '.')) || 100;

      // Build search query based on category and gender
      const categoryKeywords = CATEGORY_KEYWORDS[selectedCategory] || selectedCategory;
      const genderPrefix = gender === 'female' ? 'Für Frauen Damen' : 'Für Männer Herren';
      const query = `${categoryKeywords} ${genderPrefix}`;

      // Call backend API to search Amazon products
      const response = await fetch(
        `/api/amazon/search?q=${encodeURIComponent(query)}&maxPrice=${Math.ceil(budgetValue)}&limit=${giftCount}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load products');
      }

      const data = await response.json();

      if (data.products && data.products.length > 0) {
        setAvailableGifts(data.products);
      } else {
        setSearchError('Keine Produkte im Budget gefunden. Versuche später erneut.');
        setAvailableGifts([]);
      }
    } catch (error) {
      console.error('Error loading products:', error);

      // Parse error message for better user feedback
      let errorMessage = 'Fehler beim Laden von Produkten. Versuche später erneut.';

      if (error.message?.includes('credentials') || error.message?.includes('not configured')) {
        errorMessage = '⚠️ Amazon API nicht konfiguriert. Bitte kontaktiere den Admin.';
      } else if (error.message?.includes('503')) {
        errorMessage = '🔄 Amazon API ist momentan überlastet. Versuche in einer Minute erneut.';
      } else if (error.message?.includes('401') || error.message?.includes('403')) {
        errorMessage = '🔑 Amazon API Authentifizierung fehlgeschlagen. Überprüfe die Credentials.';
      } else if (error.message?.includes('500')) {
        errorMessage = '❌ Fehler bei der Produktsuche. Versuche später erneut.';
      }

      setSearchError(errorMessage);
      setAvailableGifts([]);
    } finally {
      setLoading(false);
    }
  };

  // Reload products when giftCount changes
  useEffect(() => {
    if (step === 3 && selectedCategory && selectedGender) {
      loadProducts(selectedGender);
    }
  }, [giftCount, selectedCategory, selectedGender, step]);

  const handleGiftToggle = (index) => {
    const updated = { ...selectedGifts };
    if (updated[index]) {
      delete updated[index];
    } else {
      updated[index] = true;
    }
    setSelectedGifts(updated);
  };

  const handleAddGifts = async () => {
    const selectedGiftsList = Object.keys(selectedGifts)
      .map(index => availableGifts[parseInt(index)])
      .filter(gift => gift);

    if (selectedGiftsList.length === 0) {
      alert('Bitte wähle mindestens ein Geschenk');
      return;
    }

    try {
      setLoading(true);
      // Transform Amazon PA products to gift format
      const transformedGifts = selectedGiftsList.map(gift => ({
        id: gift.asin || Date.now().toString() + Math.random(),
        name: gift.name,
        link: gift.link,
        category: 'other',
        price: gift.price ? `${gift.price}€` : '',
        createdAt: new Date().toISOString(),
        imageUrl: gift.imageUrl,
        rating: gift.rating,
        reviewCount: gift.reviewCount,
        source: 'amazon-pa',
      }));
      onSelectGifts(transformedGifts);
      // Reset
      setStep(1);
      setSelectedCategory(null);
      setSelectedGender(null);
      setGiftCount(10);
      setSelectedGifts({});
      setAvailableGifts([]);
    } catch (err) {
      console.error('Error adding gifts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 3) {
      setStep(2);
      setSelectedGender(null);
      setSelectedGifts({});
    } else if (step === 2) {
      setStep(1);
      setSelectedCategory(null);
    }
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <div className="bg-white rounded-lg p-6 shadow-md mb-6 border-l-4 border-purple-500">
      <h3 className="text-2xl font-bold mb-6">🎁 Geschenkideen Browser</h3>

      {/* STEP 1: Category Selection */}
      {step === 1 && (
        <div>
          <p className="text-gray-600 mb-6">Wähle eine Kategorie:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className="p-4 rounded-lg border-2 border-gray-300 hover:border-purple-500 hover:bg-purple-50 transition font-semibold text-center"
              >
                <span className="text-3xl block mb-2">{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Gender Selection */}
      {step === 2 && (
        <div>
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded border-2 border-gray-300 hover:border-purple-500 hover:bg-gray-100 transition font-semibold"
            >
              ← Zurück
            </button>
            <h4 className="text-lg font-bold">
              {selectedCategoryData?.emoji} {selectedCategoryData?.label}
            </h4>
          </div>

          <p className="text-gray-600 mb-6">Für wen suchst du ein Geschenk?</p>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleGenderSelect('female')}
              className="p-6 rounded-lg border-2 border-pink-300 hover:border-pink-500 hover:bg-pink-50 transition font-semibold text-center text-lg"
            >
              👩 Für sie (weiblich)
            </button>
            <button
              onClick={() => handleGenderSelect('male')}
              className="p-6 rounded-lg border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 transition font-semibold text-center text-lg"
            >
              👨 Für ihn (männlich)
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Count Selection & Gift Selection */}
      {step === 3 && (
        <div>
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded border-2 border-gray-300 hover:border-purple-500 hover:bg-gray-100 transition font-semibold"
            >
              ← Zurück
            </button>
            <h4 className="text-lg font-bold">
              {selectedGender === 'female' ? '👩' : '👨'} {selectedCategoryData?.label}
            </h4>
          </div>

          {/* Count Selector */}
          <div className="mb-6 p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
            <label className="block text-sm font-medium mb-3">Wie viele Vorschläge möchtest du sehen?</label>
            <div className="flex gap-3">
              {[5, 10, 15].map(count => (
                <button
                  key={count}
                  onClick={() => {
                    setGiftCount(count);
                    setSelectedGifts({});
                  }}
                  className={`px-4 py-2 rounded font-semibold transition ${
                    giftCount === count
                      ? 'bg-purple-600 text-white'
                      : 'border-2 border-purple-300 bg-white hover:bg-purple-100'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Gift Selection Grid */}
          <p className="text-gray-600 mb-4 font-semibold">
            {loading ? '🔄 Produkte werden geladen...' : `Wähle die Geschenke, die dir gefallen (${Object.keys(selectedGifts).length} ausgewählt):`}
          </p>

          {searchError && (
            <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded mb-4">
              ❌ {searchError}
            </div>
          )}

          {!loading && availableGifts.length === 0 && !searchError && (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4">
              ⚠️ Keine Geschenke im Budget verfügbar. Budget erhöhen oder andere Kategorie/Geschlecht wählen.
            </div>
          )}

          {!loading && availableGifts.length < giftCount && availableGifts.length > 0 && (
            <div className="bg-blue-100 border border-blue-400 text-blue-800 px-4 py-3 rounded mb-4">
              ℹ️ Es sind nur {availableGifts.length} Geschenke im Budget verfügbar (statt {giftCount}).
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3"></div>
                <p className="text-gray-600">Suche nach passenden Produkten...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {availableGifts.map((gift, index) => (
                <div
                  key={index}
                  onClick={() => handleGiftToggle(index)}
                  className={`border-2 rounded-lg overflow-hidden cursor-pointer transition ${
                    selectedGifts[index]
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-300 hover:border-purple-300'
                  }`}
                >
                  {/* Product Image */}
                  {gift.imageUrl && (
                    <div className="relative bg-gray-100 h-40 overflow-hidden">
                      <img
                        src={gift.imageUrl}
                        alt={gift.name}
                        className="w-full h-full object-contain p-2"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {/* Product Info */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedGifts[index] || false}
                        onChange={() => handleGiftToggle(index)}
                        className="w-5 h-5 mt-0.5 flex-shrink-0"
                        onClick={e => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-gray-900 text-sm line-clamp-2">{gift.name}</h5>

                        {/* Price */}
                        <p className="text-lg font-bold text-purple-600 mt-2">
                          {gift.price ? `${gift.price}€` : 'Preis nicht verfügbar'}
                        </p>

                        {/* Rating */}
                        {gift.rating && (
                          <p className="text-sm text-yellow-600 mt-1">
                            ⭐ {gift.rating} ({gift.reviewCount} Bewertungen)
                          </p>
                        )}

                        {/* Link */}
                        <a
                          href={gift.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm font-semibold inline-block mt-3"
                          onClick={e => e.stopPropagation()}
                        >
                          🔗 Auf Amazon anschauen
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Buttons */}
          {Object.keys(selectedGifts).length > 0 && (
            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 px-4 py-3 rounded border-2 border-gray-300 bg-white hover:bg-gray-100 font-semibold transition"
              >
                Andere Auswahl
              </button>
              <button
                onClick={handleAddGifts}
                disabled={loading}
                className="flex-1 px-4 py-3 rounded bg-purple-600 text-white hover:bg-purple-700 font-semibold transition disabled:opacity-50"
              >
                {loading ? 'Wird hinzugefügt...' : `✅ ${Object.keys(selectedGifts).length} Geschenk${Object.keys(selectedGifts).length > 1 ? 'e' : ''} hinzufügen`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
