import { useState } from 'react';
import { getRandomSuggestions, getAllCategories } from '../lib/giftSuggestions';

export default function GiftSuggestionsGenerator({ budget, onSelectGifts }) {
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestionCount, setSuggestionCount] = useState(10);

  const allCategories = getAllCategories();

  const handleCategoryToggle = (catKey) => {
    setSelectedCategories(prev => {
      if (prev.includes(catKey)) {
        return prev.filter(c => c !== catKey);
      }
      return [...prev, catKey];
    });
  };

  const generateSuggestions = () => {
    if (selectedCategories.length === 0) {
      alert('Bitte wähle mindestens eine Kategorie');
      return;
    }

    setLoading(true);
    // Simuliere kurze Verzögerung für besseres UX
    setTimeout(() => {
      const newSuggestions = getRandomSuggestions(selectedCategories, budget, suggestionCount);
      setSuggestions(newSuggestions);
      setSelectedSuggestions({});
      setShowSuggestions(true);
      setLoading(false);
    }, 300);
  };

  const handleSuggestionToggle = (index) => {
    const updated = { ...selectedSuggestions };
    if (updated[index]) {
      delete updated[index];
    } else {
      updated[index] = true;
    }
    setSelectedSuggestions(updated);
  };

  const handleAddSuggestions = () => {
    const selectedGifts = Object.keys(selectedSuggestions)
      .map(index => suggestions[parseInt(index)])
      .filter(gift => gift);

    if (selectedGifts.length === 0) {
      alert('Bitte wähle mindestens ein Geschenk');
      return;
    }

    onSelectGifts(selectedGifts);
    // Reset
    setSelectedCategories([]);
    setSuggestions([]);
    setSelectedSuggestions({});
    setShowSuggestions(false);
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md mb-6 border-l-4 border-purple-500">
      <h3 className="text-2xl font-bold mb-4">✨ Geschenkvorschläge Generator</h3>

      {!showSuggestions ? (
        <>
          <p className="text-gray-600 mb-4">
            Wähle eine oder mehrere Kategorien und erhalte Vorschläge für dein Budget (<strong>{budget}</strong>):
          </p>

          {/* Suggestion Count Selection */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
            <label className="block text-sm font-medium mb-3">Anzahl Vorschläge:</label>
            <div className="flex gap-3">
              {[5, 10, 15].map(count => (
                <button
                  key={count}
                  onClick={() => setSuggestionCount(count)}
                  className={`px-4 py-2 rounded font-semibold transition ${
                    suggestionCount === count
                      ? 'bg-blue-500 text-white'
                      : 'border-2 border-blue-300 bg-white hover:bg-blue-100'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {allCategories.map(cat => (
              <button
                key={cat.key}
                onClick={() => handleCategoryToggle(cat.key)}
                className={`p-3 rounded-lg border-2 font-semibold transition ${
                  selectedCategories.includes(cat.key)
                    ? 'border-purple-500 bg-purple-100 text-purple-900'
                    : 'border-gray-300 hover:border-purple-300'
                }`}
              >
                <span className="text-xl mr-2">{cat.emoji}</span>
                <div className="text-left">
                  <div className="text-sm">{cat.label}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Generate Button */}
          <button
            onClick={generateSuggestions}
            disabled={selectedCategories.length === 0 || loading}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? '🔄 Generiere Vorschläge...' : '🎲 Zufallsvorschläge generieren'}
          </button>
        </>
      ) : (
        <>
          <p className="text-gray-600 mb-4 font-semibold">
            💡 Hier sind {suggestions.length} zufällige Vorschläge für dich:
          </p>

          {/* Suggestions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
            {suggestions.map((gift, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  selectedSuggestions[index]
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-300 hover:border-purple-300'
                }`}
                onClick={() => handleSuggestionToggle(index)}
              >
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedSuggestions[index] || false}
                    onChange={() => handleSuggestionToggle(index)}
                    className="w-5 h-5 mt-1"
                  />

                  {/* Gift Info */}
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900">{gift.name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-lg font-bold text-purple-600">
                        {gift.price}€
                      </span>
                      <a
                        href={gift.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-semibold"
                        onClick={e => e.stopPropagation()}
                      >
                        🔗 Link
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selected Summary */}
          {Object.keys(selectedSuggestions).length > 0 && (
            <div className="bg-purple-50 border border-purple-300 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-purple-900 mb-2">
                ✅ {Object.keys(selectedSuggestions).length} Geschenk(e) ausgewählt:
              </p>
              <ul className="text-sm text-purple-800 space-y-1">
                {Object.keys(selectedSuggestions).map(index => {
                  const gift = suggestions[parseInt(index)];
                  return (
                    <li key={index}>
                      • <strong>{gift.name}</strong> - {gift.price}€
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => {
                setShowSuggestions(false);
                setSelectedCategories([]);
                setSuggestions([]);
                setSelectedSuggestions({});
              }}
              className="flex-1 btn-outline"
            >
              ← Neue Vorschläge
            </button>
            <button
              onClick={handleAddSuggestions}
              disabled={Object.keys(selectedSuggestions).length === 0}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✅ Zu Liste hinzufügen
            </button>
          </div>
        </>
      )}
    </div>
  );
}
