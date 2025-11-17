import { useState, useEffect } from 'react';
import { GIFT_CATEGORIES } from '../lib/categories';

export default function GiftGallery({ group, groupId, participantId }) {
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchText, setSearchText] = useState('');

  // Get the person we're buying for
  const receiver = group.participants.find(p => p.id === group.pairing?.[participantId]);

  // Load gifts on mount
  useEffect(() => {
    if (receiver) {
      loadGifts();
    }
  }, [receiver?.id, groupId]);

  const loadGifts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/gifts/${groupId}?participantId=${receiver.id}`
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

  const toggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  // Filter gifts
  const filteredGifts = gifts.filter(gift => {
    const matchesCategory =
      selectedCategories.length === 0 || selectedCategories.includes(gift.category);
    const matchesSearch = gift.name.toLowerCase().includes(searchText.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (loading) return <p className="loading">Lade Geschenkeliste...</p>;
  if (!receiver) return <p className="text-red-600">Empfänger nicht gefunden</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-blue-500">
        <h2 className="text-3xl font-bold mb-2">
          🎁 Geschenke für <span className="text-blue-600">{receiver.name}</span>
        </h2>
        <p className="text-gray-600">
          {receiver.name} hat {gifts.length} tolle Geschenke für dich ausgewählt!
        </p>
        <p className="text-sm text-gray-500 mt-2">Budget: <strong>{group.budget}</strong></p>
      </div>

      {gifts.length === 0 ? (
        <div className="card bg-yellow-50 border-l-4 border-yellow-500 text-center py-8">
          <p className="text-lg font-semibold text-yellow-700">😴 Noch keine Geschenke eingetragen</p>
          <p className="text-gray-600">Komm später nochmal vorbei!</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="card">
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="Nach Geschenk suchen..."
              className="input-field w-full"
            />
          </div>

          {/* Category Filter */}
          <div className="card">
            <h3 className="font-semibold mb-3">🏷️ Nach Kategorie filtern</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {GIFT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => toggleCategory(cat.id)}
                  className={`p-3 rounded-lg border-2 transition font-medium text-sm ${
                    selectedCategories.includes(cat.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white hover:border-gray-400'
                  }`}
                >
                  <span className="text-lg mr-1">{cat.emoji}</span>
                  <br />
                  <span className="text-xs">{cat.label.split(' ')[1]}</span>
                </button>
              ))}
            </div>
            {selectedCategories.length > 0 && (
              <button
                onClick={() => setSelectedCategories([])}
                className="mt-3 text-sm text-blue-600 hover:underline"
              >
                Alle Filter löschen
              </button>
            )}
          </div>

          {/* Gift Grid */}
          {filteredGifts.length > 0 ? (
            <div>
              <p className="text-gray-600 mb-4">
                {filteredGifts.length} von {gifts.length} Geschenken
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGifts.map((gift, idx) => (
                  <div
                    key={gift.id}
                    className="card hover:shadow-lg transition transform hover:scale-105"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-3xl">
                        {GIFT_CATEGORIES.find(c => c.id === gift.category)?.emoji || '✨'}
                      </span>
                      <div>
                        <h4 className="font-bold text-lg">{gift.name}</h4>
                        <p className="text-xs text-gray-500">
                          {GIFT_CATEGORIES.find(c => c.id === gift.category)?.label}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      {gift.price && (
                        <div className="bg-green-100 rounded-lg p-2 text-center">
                          <p className="font-bold text-green-700">{gift.price}</p>
                        </div>
                      )}

                      {gift.link && (
                        <a
                          href={gift.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block w-full bg-blue-600 text-white py-2 rounded-lg text-center font-semibold hover:bg-blue-700 transition"
                        >
                          Auf Amazon anschauen →
                        </a>
                      )}
                    </div>

                    <p className="text-xs text-gray-500 text-right">
                      {idx + 1} von {gifts.length}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card text-center py-8 bg-gray-50">
              <p className="text-gray-600">😕 Keine Geschenke mit dieser Filterung gefunden</p>
              <button
                onClick={() => {
                  setSelectedCategories([]);
                  setSearchText('');
                }}
                className="mt-3 btn-outline"
              >
                Filter zurücksetzen
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
