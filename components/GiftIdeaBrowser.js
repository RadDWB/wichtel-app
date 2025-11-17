import { useState } from 'react';
import { getAllGiftCategories, getGiftIdeasByCategory } from '../lib/giftIdeas';

export default function GiftIdeaBrowser({ budget, onSelectGifts }) {
  const [step, setStep] = useState(1); // 1: Kategorie, 2: Geschlecht, 3: Anzahl & Auswahl
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [giftCount, setGiftCount] = useState(10);
  const [selectedGifts, setSelectedGifts] = useState({});
  const [loading, setLoading] = useState(false);

  const categories = getAllGiftCategories();

  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setStep(2);
  };

  const handleGenderSelect = (gender) => {
    setSelectedGender(gender);
    setStep(3);
    setSelectedGifts({});
  };

  const getAvailableGifts = () => {
    if (!selectedCategory || !selectedGender) return [];
    return getGiftIdeasByCategory(selectedCategory, selectedGender).slice(0, giftCount);
  };

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
    const gifts = getAvailableGifts();
    const selectedGiftsList = Object.keys(selectedGifts)
      .map(index => gifts[parseInt(index)])
      .filter(gift => gift);

    if (selectedGiftsList.length === 0) {
      alert('Bitte wähle mindestens ein Geschenk');
      return;
    }

    try {
      setLoading(true);
      onSelectGifts(selectedGiftsList);
      // Reset
      setStep(1);
      setSelectedCategory(null);
      setSelectedGender(null);
      setGiftCount(10);
      setSelectedGifts({});
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
  const availableGifts = getAvailableGifts();

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
            Wähle die Geschenke, die dir gefallen ({Object.keys(selectedGifts).length} ausgewählt):
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {availableGifts.map((gift, index) => (
              <div
                key={index}
                onClick={() => handleGiftToggle(index)}
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  selectedGifts[index]
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedGifts[index] || false}
                    onChange={() => handleGiftToggle(index)}
                    className="w-5 h-5 mt-1"
                  />
                  <div className="flex-1">
                    <h5 className="font-bold text-gray-900">{gift.name}</h5>
                    <p className="text-lg font-bold text-purple-600 mt-2">{gift.price}€</p>
                    <a
                      href={gift.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm font-semibold inline-block mt-2"
                      onClick={e => e.stopPropagation()}
                    >
                      🔗 Auf Amazon anschauen
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

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
