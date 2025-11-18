import { useState } from 'react';
import { AUDIENCES, CATEGORIES, PRICE_LABELS, PRICE_RANGES, generateAmazonUrl } from '../lib/amazon-filters';

export default function AmazonFilterSelector() {
  const [selectedAudience, setSelectedAudience] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const getAmazonLink = (priceRange) => {
    const priceRangeKey = PRICE_RANGES[priceRange] || null;
    return generateAmazonUrl(priceRangeKey, selectedAudience, selectedCategory);
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border-2 border-orange-400 rounded-lg p-6 shadow-md">
      <h3 className="text-xl font-bold text-orange-900 mb-4">🎯 Geschenk-Filter für Amazon</h3>

      {/* Audience Selection */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-900 mb-3">Für wen suchst du?</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(AUDIENCES).map(([key, audience]) => (
            <button
              key={key}
              onClick={() => setSelectedAudience(selectedAudience === key ? null : key)}
              className={`py-2 px-3 rounded-lg font-semibold text-sm transition ${
                selectedAudience === key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-blue-400'
              }`}
            >
              {audience.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category Selection */}
      <div className="mb-6">
        <p className="text-sm font-semibold text-gray-900 mb-3">Produkttyp:</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {Object.entries(CATEGORIES).map(([key, category]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(selectedCategory === key ? null : key)}
              className={`py-2 px-3 rounded-lg font-semibold text-sm transition ${
                selectedCategory === key
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-green-400'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range Buttons */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-gray-900 mb-3">Budget:</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {PRICE_LABELS.map((price) => (
            <a
              key={price.range || 'all'}
              href={getAmazonLink(price.range)}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-4 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-center transition transform hover:scale-105 shadow-md"
            >
              {price.label}
            </a>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-600 text-center">
        💚 Alle Käufe über diese Links unterstützen uns durch Affiliate-Provisionen!
      </p>
    </div>
  );
}
