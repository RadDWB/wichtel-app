// Geschenkvorschläge für verschiedene Kategorien und Budgets
// Struktur: category -> budget -> array of gift suggestions

const AMAZON_AFFILIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'httpwwwspor03-21';

const addAffiliateTag = (url) => {
  if (!url) return '';
  if (url.includes('?')) {
    return `${url}&tag=${AMAZON_AFFILIATE_TAG}`;
  }
  return `${url}?tag=${AMAZON_AFFILIATE_TAG}`;
};

export const GIFT_CATEGORIES_SUGGESTIONS = {
  tech: {
    label: '💻 Technik & Gadgets',
    emoji: '💻',
    suggestions: {
      20: [
        { name: 'USB-C Kabel Set', price: 12.99, link: addAffiliateTag('https://www.amazon.de/s?k=usb+c+kabel+set') },
        { name: 'Wireless Charger Pad', price: 15.99, link: addAffiliateTag('https://www.amazon.de/s?k=wireless+charger') },
        { name: 'Phone Pop Socket', price: 8.99, link: addAffiliateTag('https://www.amazon.de/s?k=pop+socket') },
        { name: 'Bluetooth Speaker Mini', price: 18.99, link: addAffiliateTag('https://www.amazon.de/s?k=bluetooth+speaker+mini') },
        { name: 'USB Hub Adapter', price: 14.99, link: addAffiliateTag('https://www.amazon.de/s?k=usb+hub') },
        { name: 'Webcam HD', price: 19.99, link: addAffiliateTag('https://www.amazon.de/s?k=webcam+hd') },
      ],
      30: [
        { name: 'Powerbank 20000mAh', price: 25.99, link: addAffiliateTag('https://www.amazon.de/s?k=powerbank+20000') },
        { name: 'USB Ventilator', price: 12.99, link: addAffiliateTag('https://www.amazon.de/s?k=usb+ventilator') },
        { name: 'LED Desk Lamp', price: 24.99, link: addAffiliateTag('https://www.amazon.de/s?k=led+desk+lamp') },
        { name: 'HDMI Kabel 4K', price: 9.99, link: addAffiliateTag('https://www.amazon.de/s?k=hdmi+kabel+4k') },
        { name: 'Kabelorganizer Set', price: 11.99, link: addAffiliateTag('https://www.amazon.de/s?k=kabelorganizer') },
        { name: 'Phone Stand Halter', price: 14.99, link: addAffiliateTag('https://www.amazon.de/s?k=phone+stand') },
      ],
      50: [
        { name: 'Bluetooth Kopfhörer', price: 39.99, link: addAffiliateTag('https://www.amazon.de/s?k=bluetooth+kopfhörer') },
        { name: 'Smart WiFi Glühbirne', price: 29.99, link: addAffiliateTag('https://www.amazon.de/s?k=smart+bulb+wifi') },
        { name: 'Portable SSD 500GB', price: 49.99, link: addAffiliateTag('https://www.amazon.de/s?k=portable+ssd+500gb') },
        { name: 'Webcam mit Mikrofon', price: 34.99, link: addAffiliateTag('https://www.amazon.de/s?k=webcam+mikrofon') },
        { name: 'Laptop Ständer', price: 29.99, link: addAffiliateTag('https://www.amazon.de/s?k=laptop+ständer') },
      ],
    },
  },
  lifestyle: {
    label: '🌿 Lifestyle & Wellness',
    emoji: '🌿',
    suggestions: {
      20: [
        { name: 'Duftkerze Vanille', price: 14.99, link: addAffiliateTag('https://www.amazon.de/s?k=duftkerze+vanille') },
        { name: 'Bad Bomben Set', price: 16.99, link: addAffiliateTag('https://www.amazon.de/s?k=bath+bombs') },
        { name: 'Handcreme Set', price: 12.99, link: addAffiliateTag('https://www.amazon.de/s?k=handcreme+set') },
        { name: 'Lip Balm Set', price: 9.99, link: addAffiliateTag('https://www.amazon.de/s?k=lip+balm+set') },
        { name: 'Zahnseide Holder', price: 8.99, link: addAffiliateTag('https://www.amazon.de/s?k=zahnseide+holder') },
        { name: 'Aromatherapie Öle', price: 19.99, link: addAffiliateTag('https://www.amazon.de/s?k=aromatherapie+öle') },
      ],
      30: [
        { name: 'Augenkissen mit Gel', price: 16.99, link: addAffiliateTag('https://www.amazon.de/s?k=augenkissen+gel') },
        { name: 'Gesichtsmask Set', price: 19.99, link: addAffiliateTag('https://www.amazon.de/s?k=gesichtsmaske+set') },
        { name: 'Massageroller', price: 24.99, link: addAffiliateTag('https://www.amazon.de/s?k=massageroller') },
        { name: 'Yoga Matte Kork', price: 28.99, link: addAffiliateTag('https://www.amazon.de/s?k=yoga+matte+kork') },
        { name: 'Meditation Kissen', price: 22.99, link: addAffiliateTag('https://www.amazon.de/s?k=meditation+kissen') },
      ],
      50: [
        { name: 'Premium Skincare Set', price: 45.99, link: addAffiliateTag('https://www.amazon.de/s?k=skincare+set+premium') },
        { name: 'Massage Gun', price: 49.99, link: addAffiliateTag('https://www.amazon.de/s?k=massage+gun') },
        { name: 'Electric Toothbrush', price: 39.99, link: addAffiliateTag('https://www.amazon.de/s?k=electric+toothbrush') },
      ],
    },
  },
  books: {
    label: '📚 Bücher & Wissen',
    emoji: '📚',
    suggestions: {
      20: [
        { name: 'Bestseller Roman', price: 14.99, link: addAffiliateTag('https://www.amazon.de/s?k=bestseller+roman') },
        { name: 'Sachbuch Psychologie', price: 16.99, link: addAffiliateTag('https://www.amazon.de/s?k=sachbuch+psychologie') },
        { name: 'Comic Graphic Novel', price: 15.99, link: addAffiliateTag('https://www.amazon.de/s?k=graphic+novel') },
        { name: 'Kochbuch Vegetarisch', price: 18.99, link: addAffiliateTag('https://www.amazon.de/s?k=kochbuch+vegetarisch') },
      ],
      30: [
        { name: 'Biografie Hardcover', price: 22.99, link: addAffiliateTag('https://www.amazon.de/s?k=biografie+hardcover') },
        { name: 'Fantasy Buch Reihe', price: 25.99, link: addAffiliateTag('https://www.amazon.de/s?k=fantasy+buch+reihe') },
        { name: 'Fachbuch IT/Programmierung', price: 29.99, link: addAffiliateTag('https://www.amazon.de/s?k=programmierung+buch') },
      ],
      50: [
        { name: 'Buch Box Set', price: 45.99, link: addAffiliateTag('https://www.amazon.de/s?k=book+box+set') },
        { name: 'HandSigniertes Buch', price: 35.99, link: addAffiliateTag('https://www.amazon.de/s?k=signiert+buch') },
      ],
    },
  },
  home: {
    label: '🏠 Home & Deko',
    emoji: '🏠',
    suggestions: {
      20: [
        { name: 'Kissen Kissenbezug', price: 14.99, link: addAffiliateTag('https://www.amazon.de/s?k=kissen+kissenbezug') },
        { name: 'Wanddeko Poster', price: 12.99, link: addAffiliateTag('https://www.amazon.de/s?k=wanddeko+poster') },
        { name: 'Pflanzentopf Keramik', price: 16.99, link: addAffiliateTag('https://www.amazon.de/s?k=pflanzentopf+keramik') },
        { name: 'Teppich Matte', price: 19.99, link: addAffiliateTag('https://www.amazon.de/s?k=teppich+matte') },
        { name: 'Wandregal Holz', price: 24.99, link: addAffiliateTag('https://www.amazon.de/s?k=wandregal+holz') },
      ],
      30: [
        { name: 'LED String Lights', price: 16.99, link: addAffiliateTag('https://www.amazon.de/s?k=led+string+lights') },
        { name: 'Bild Leinwand Set', price: 22.99, link: addAffiliateTag('https://www.amazon.de/s?k=bild+leinwand+set') },
        { name: 'Bettwäsche Set', price: 28.99, link: addAffiliateTag('https://www.amazon.de/s?k=bettwäsche+set') },
        { name: 'Spiegelleuchte', price: 29.99, link: addAffiliateTag('https://www.amazon.de/s?k=spiegelleuchte') },
      ],
      50: [
        { name: 'Designer Lampe', price: 49.99, link: addAffiliateTag('https://www.amazon.de/s?k=designer+lampe') },
        { name: 'Stehlampe Modern', price: 45.99, link: addAffiliateTag('https://www.amazon.de/s?k=stehlampe+modern') },
      ],
    },
  },
  sports: {
    label: '⚽ Sport & Fitness',
    emoji: '⚽',
    suggestions: {
      20: [
        { name: 'Fitness Handschuhe', price: 16.99, link: addAffiliateTag('https://www.amazon.de/s?k=fitness+handschuhe') },
        { name: 'Springseil', price: 12.99, link: addAffiliateTag('https://www.amazon.de/s?k=springseil') },
        { name: 'Widerstandsbänder Set', price: 14.99, link: addAffiliateTag('https://www.amazon.de/s?k=widerstandsbänder') },
        { name: 'Yoga Blöcke', price: 17.99, link: addAffiliateTag('https://www.amazon.de/s?k=yoga+blöcke') },
      ],
      30: [
        { name: 'Hanteln Set', price: 28.99, link: addAffiliateTag('https://www.amazon.de/s?k=hanteln+set') },
        { name: 'Balance Ball', price: 22.99, link: addAffiliateTag('https://www.amazon.de/s?k=balance+ball') },
        { name: 'Fitness Tracker Band', price: 24.99, link: addAffiliateTag('https://www.amazon.de/s?k=fitness+tracker') },
      ],
      50: [
        { name: 'Laufband Mini', price: 49.99, link: addAffiliateTag('https://www.amazon.de/s?k=laufband+mini') },
        { name: 'Crosstrainer', price: 199.99, link: addAffiliateTag('https://www.amazon.de/s?k=crosstrainer') },
      ],
    },
  },
  food: {
    label: '🍷 Getränke & Leckereien',
    emoji: '🍷',
    suggestions: {
      20: [
        { name: 'Kaffee Probierset', price: 16.99, link: addAffiliateTag('https://www.amazon.de/s?k=kaffee+probierset') },
        { name: 'Tee Gourmet Set', price: 14.99, link: addAffiliateTag('https://www.amazon.de/s?k=tee+gourmet+set') },
        { name: 'Schokolade Praliné Box', price: 12.99, link: addAffiliateTag('https://www.amazon.de/s?k=praline+schokolade') },
        { name: 'Honig Set', price: 18.99, link: addAffiliateTag('https://www.amazon.de/s?k=honig+set') },
      ],
      30: [
        { name: 'Gin Set mit Gläsern', price: 24.99, link: addAffiliateTag('https://www.amazon.de/s?k=gin+set') },
        { name: 'Wein Probierpaket', price: 28.99, link: addAffiliateTag('https://www.amazon.de/s?k=wein+paket') },
        { name: 'Nussbutterbox', price: 22.99, link: addAffiliateTag('https://www.amazon.de/s?k=nussbutterbox') },
      ],
      50: [
        { name: 'Whiskey Sammlerbox', price: 49.99, link: addAffiliateTag('https://www.amazon.de/s?k=whiskey+set') },
      ],
    },
  },
};

// Hole zufällige Vorschläge basierend auf Kategorien und Budget
export const getRandomSuggestions = (selectedCategories, budget, count = 5) => {
  const suggestions = [];

  // Budget in Nummer konvertieren
  const budgetValue = parseFloat(String(budget).replace(/[^0-9.,]/g, '').replace(',', '.')) || 100;

  // Finde passende Budget-Tier (20, 30, 50 oder höher)
  const budgetTiers = [20, 30, 50];
  const bestTier = budgetTiers.reverse().find(tier => budgetValue >= tier) || 20;

  selectedCategories.forEach(catKey => {
    const category = GIFT_CATEGORIES_SUGGESTIONS[catKey];
    if (category && category.suggestions[bestTier]) {
      const categoryItems = category.suggestions[bestTier];
      // Shuffle und nimm zufällige Items
      const shuffled = [...categoryItems].sort(() => Math.random() - 0.5);
      suggestions.push(...shuffled.slice(0, 3));
    }
  });

  // Shuffle Ergebnis und begrenzen
  return suggestions.sort(() => Math.random() - 0.5).slice(0, count);
};

export const getAllCategories = () => {
  return Object.entries(GIFT_CATEGORIES_SUGGESTIONS).map(([key, cat]) => ({
    key,
    label: cat.label,
    emoji: cat.emoji,
  }));
};
