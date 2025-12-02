import { useState } from 'react';

const AFFILIATE_TAG = 'httpwwwspor03-21';
const BASE_URL = 'https://www.amazon.de/s';

// Filter mit echten Preisranges (min/max in €) für p_36 Amazon-Parameter
// Age filters mit maxAge für intelligente Jungen/Mädchen-Logik
const AMAZON_FILTERS = {
  price: [
    { label: '1-5 €', min: 1, max: 5 },
    { label: '5-10 €', min: 5, max: 10 },
    { label: '10-15 €', min: 10, max: 15 },
    { label: '15-20 €', min: 15, max: 20 },
    { label: '20-30 €', min: 20, max: 30 },
    { label: '30-50 €', min: 30, max: 50 },
    { label: '50-100 €', min: 50, max: 100 },
    { label: '100+ €', min: 100, max: null },
  ],
  age: [
    { label: '👶 Baby (0-2 Jahre)', maxAge: 2, queryBase: 'Baby Geschenk' },
    { label: '👧 Kind (3-7 Jahre)', maxAge: 7, queryBase: 'Kinder 3-7 Jahre Geschenk' },
    { label: '🧒 Schulkind (8-12 Jahre)', maxAge: 12, queryBase: 'Kinder 8-12 Jahre Geschenk' },
    { label: '👦 Teenager (13-17 Jahre)', maxAge: 17, queryBase: 'Teenager Geschenk' },
    { label: '👨 Erwachsener (18-40 Jahre)', maxAge: 40, queryBase: 'Geschenk für Erwachsene' },
    { label: '👩 Reifer (40-60 Jahre)', maxAge: 60, queryBase: 'Geschenk 40-60 Jahre' },
    { label: '👴 Senioren (über 60 Jahre)', maxAge: 999, queryBase: 'Geschenk für Senioren' },
  ],
  gender: [
    { label: '👩 Weiblich', queryAdult: 'für Frauen', queryChild: 'für Mädchen' },
    { label: '👨 Männlich', queryAdult: 'für Männer', queryChild: 'für Jungen' },
    { label: '❓ Egal', queryAdult: '', queryChild: '' },
  ],
  category: [
    { label: '📚 Bücher & E-Reader', query: 'Bücher E-Reader' },
    { label: '🎮 Gaming & Konsolen', query: 'Gaming Konsole' },
    { label: '🎧 Audio & Kopfhörer', query: 'Kopfhörer Bluetooth' },
    { label: '⌚ Uhren & Schmuck', query: 'Uhren Schmuck' },
    { label: '💻 Elektronik & Gadgets', query: 'Elektronik Gadget' },
    { label: '🏃 Sport & Outdoor', query: 'Sport Outdoor' },
    { label: '🧘 Beauty & Wellness', query: 'Beauty Wellness' },
    { label: '🍳 Haushalt & Küche', query: 'Küche Haushalt' },
  ],
};

// Build Amazon search URL with proper p_36 price filter and smart gender detection
function buildAmazonSearchUrl(selectedFilters) {
  const { price, category, age: selectedAge, gender: selectedGender } = selectedFilters;

  const queryParts = ['geschenkideen'];

  // Add category
  if (category?.query) queryParts.push(category.query);

  // Add age base
  if (selectedAge?.queryBase) queryParts.push(selectedAge.queryBase);

  // Smart gender detection: Jungen/Mädchen für Kinder, Männer/Frauen für Erwachsene
  if (selectedGender && selectedGender?.queryAdult) {
    const useChildVersion = selectedAge?.maxAge <= 17; // bis 17 Jahre = Kind/Teenager
    const genderQuery = useChildVersion
      ? selectedGender.queryChild
      : selectedGender.queryAdult;

    if (genderQuery) queryParts.push(genderQuery);
  }

  const searchParams = new URLSearchParams();

  // Search keywords (without price text)
  searchParams.set('k', queryParts.join(' '));

  // REAL price filter: p_36 with price range in cents
  if (price) {
    let priceStr = '';
    if (price.min !== undefined && price.min !== null) {
      priceStr += price.min * 100; // convert € to cents
    }
    priceStr += '-';
    if (price.max !== undefined && price.max !== null) {
      priceStr += price.max * 100;
    }
    searchParams.set('rh', `p_36:${priceStr}`);
  }

  // For cheap gifts (< 20 €) always sort by price ascending → higher conversion!
  if (price && price.max && price.max <= 20) {
    searchParams.set('s', 'price-asc-rank');
  }

  // Language and affiliate tag
  searchParams.set('language', 'de_DE');
  searchParams.set('tag', AFFILIATE_TAG);

  return `${BASE_URL}?${searchParams.toString()}`;
}

export default function AmazonFilterSelector({ preselectedPrice = null, compact = false }) {
  const [selectedPrice, setSelectedPrice] = useState(
    preselectedPrice ? AMAZON_FILTERS.price.find(p => p.label === preselectedPrice) : null
  );
  const [selectedAge, setSelectedAge] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleSearch = () => {
    const url = buildAmazonSearchUrl({
      price: selectedPrice,
      category: selectedCategory,
      age: selectedAge,
      gender: selectedGender,
    });
    window.open(url, '_blank');
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 rounded-lg p-6 shadow-md space-y-6">
      <h3 className="text-xl font-bold text-orange-900">🎯 Geschenk-Filter für Amazon</h3>

      {/* Budget - Vorausgewählt */}
      <div className="bg-orange-100 border border-orange-300 p-4 rounded-lg">
        <p className="text-sm font-semibold text-orange-900 mb-3">💰 SCHRITT 1: Budget wählen</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {AMAZON_FILTERS.price.map((range) => (
            <button
              key={range.label}
              onClick={() => setSelectedPrice(range)}
              className={`py-2 px-3 rounded-lg font-semibold text-sm transition ${
                selectedPrice?.label === range.label
                  ? 'bg-orange-600 text-white shadow-md'
                  : 'bg-white border border-gray-300 text-gray-900 hover:border-orange-400'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Kategorie */}
      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded">
        <p className="text-sm font-semibold text-green-900 mb-3">🏷️ SCHRITT 2: Kategorie (optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AMAZON_FILTERS.category.map((cat) => (
            <button
              key={cat.label}
              onClick={() => setSelectedCategory(cat)}
              className={`text-sm py-2 px-3 rounded font-semibold transition ${
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
        <p className="text-sm font-semibold text-blue-900 mb-3">👥 SCHRITT 3: Altersbereich (optional)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {AMAZON_FILTERS.age.map((age) => (
            <button
              key={age.label}
              onClick={() => setSelectedAge(age)}
              className={`text-sm py-2 px-3 rounded font-semibold transition ${
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
        <p className="text-sm font-semibold text-purple-900 mb-3">👫 SCHRITT 4: Geschlecht (optional)</p>
        <div className="grid grid-cols-2 gap-2">
          {AMAZON_FILTERS.gender.map((gender) => (
            <button
              key={gender.label}
              onClick={() => setSelectedGender(gender)}
              className={`text-sm py-2 px-3 rounded font-semibold transition ${
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

      {/* Search Button */}
      <button
        onClick={handleSearch}
        className="w-full py-4 px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg font-bold text-lg transition shadow-lg transform hover:scale-105"
      >
        🚀 AMAZON-SUCHE STARTEN
      </button>

      <p className="text-xs text-gray-600 text-center">
        💚 Wir nehmen am Amazon Affiliate Programm teil, Sie unterstützen uns durch Ihre Käufe!
      </p>
    </div>
  );
}
