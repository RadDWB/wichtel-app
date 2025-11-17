import { useState } from 'react';
import { getProductsByBudget } from '../lib/products';

export default function ProductBrowser({ budget, onSelectProducts }) {
  const [selected, setSelected] = useState({});

  // Extrahiere numerischen Wert aus Budget (z.B. "30 €" -> 30)
  const budgetValue = parseFloat(String(budget).replace(/[^0-9.,]/g, '').replace(',', '.')) || 100;
  const products = getProductsByBudget(budgetValue);

  const handleToggle = (productId) => {
    const updated = { ...selected };
    if (updated[productId]) {
      delete updated[productId];
    } else {
      updated[productId] = true;
    }
    setSelected(updated);
  };

  const handleAddSelected = () => {
    const selectedProducts = products.filter(p => selected[p.id]);
    if (selectedProducts.length === 0) {
      alert('Bitte wähle mindestens ein Produkt');
      return;
    }
    onSelectProducts(selectedProducts);
    setSelected({});
  };

  return (
    <div className="bg-white rounded-lg p-6 shadow-md mb-6">
      <h3 className="text-2xl font-bold mb-4">🛍️ Vorgeschlagene Bluetooth Kopfhörer</h3>
      <p className="text-gray-600 mb-6">
        Wähle bis zu 10 Produkte aus deinem Budget (max <strong>{budgetValue}€</strong>) aus:
      </p>

      {products.length === 0 ? (
        <p className="text-red-600 font-semibold">
          ⚠️ Keine Produkte in deinem Budget-Bereich verfügbar
        </p>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {products.map((product) => (
              <div
                key={product.id}
                className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                  selected[product.id]
                    ? 'border-red-500 bg-red-50'
                    : 'border-gray-300 hover:border-red-300'
                }`}
                onClick={() => handleToggle(product.id)}
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded"
                      onError={(e) => {
                        e.target.src =
                          'https://via.placeholder.com/80?text=No+Image';
                      }}
                    />
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {product.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {product.description}
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={selected[product.id] || false}
                        onChange={() => handleToggle(product.id)}
                        className="w-5 h-5 mt-1"
                      />
                    </div>

                    {/* Price & Rating */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-red-600">
                          {product.price}€
                        </span>
                        {product.rating && (
                          <span className="ml-2 text-yellow-500">
                            ⭐ {product.rating}
                          </span>
                        )}
                      </div>
                      <a
                        href={product.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline text-sm font-semibold"
                        onClick={(e) => e.stopPropagation()}
                      >
                        🔗 Amazon
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Selection Summary */}
          {Object.keys(selected).length > 0 && (
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 mb-4">
              <p className="text-sm font-semibold text-blue-900 mb-3">
                ✅ {Object.keys(selected).length} Produkt(e) ausgewählt:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                {Object.keys(selected).map((id) => {
                  const product = products.find((p) => p.id === id);
                  return (
                    <li key={id}>
                      • <strong>{product.name}</strong> - {product.price}€
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Add Button */}
          <button
            onClick={handleAddSelected}
            disabled={Object.keys(selected).length === 0}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✅ Ausgewählte Produkte zur Liste hinzufügen
          </button>
        </>
      )}
    </div>
  );
}
