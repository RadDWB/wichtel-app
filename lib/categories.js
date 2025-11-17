// Amazon Kategorien für Geschenke
export const GIFT_CATEGORIES = [
  { id: 'tech', label: '📱 Technik & Elektronik', emoji: '📱' },
  { id: 'fashion', label: '👕 Mode & Accessoires', emoji: '👕' },
  { id: 'gaming', label: '🎮 Gaming & Zubehör', emoji: '🎮' },
  { id: 'home', label: '🏠 Haushalt & Wohnen', emoji: '🏠' },
  { id: 'beauty', label: '💄 Beauty & Kosmetik', emoji: '💄' },
  { id: 'sports', label: '⚽ Sport & Outdoor', emoji: '⚽' },
  { id: 'books', label: '📚 Bücher & eBooks', emoji: '📚' },
  { id: 'music', label: '🎵 Musik & Audio', emoji: '🎵' },
  { id: 'kitchen', label: '🍳 Küche & Kochen', emoji: '🍳' },
  { id: 'toys', label: '🎯 Spielzeug & Hobbys', emoji: '🎯' },
  { id: 'garden', label: '🌱 Garten & Pflanzen', emoji: '🌱' },
  { id: 'other', label: '✨ Sonstiges', emoji: '✨' },
];

export const getCategoryLabel = (id) => {
  return GIFT_CATEGORIES.find(cat => cat.id === id)?.label || 'Sonstiges';
};

export const getCategoryEmoji = (id) => {
  return GIFT_CATEGORIES.find(cat => cat.id === id)?.emoji || '✨';
};
