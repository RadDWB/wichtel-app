// Vordefinierte Amazon-Produkte mit Affiliate Links
// Budget-freundliche Vorschläge für verschiedene Kategorien

const AMAZON_AFFILIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || 'wichtel-app-21';

const addAffiliateTag = (url) => {
  if (!url) return '';
  if (url.includes('?')) {
    return `${url}&tag=${AMAZON_AFFILIATE_TAG}`;
  }
  return `${url}?tag=${AMAZON_AFFILIATE_TAG}`;
};

export const BLUETOOTH_HEADPHONES = [
  {
    id: 'bh-1',
    name: 'soundcore by Anker Space Q45',
    price: 99.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/51XutuqXZOL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B0C6RXGJYZ'),
    rating: 4.5,
    description: 'Noise-Cancelling, 50h Akku'
  },
  {
    id: 'bh-2',
    name: 'JBL Tune 510BT',
    price: 29.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/41VRzn1DhVL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B08YQ2DQLC'),
    rating: 4.3,
    description: 'Bluetooth, 40h Akku, kompakt'
  },
  {
    id: 'bh-3',
    name: 'Anker Soundcore Life Q30',
    price: 49.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/51FKaMj3FkL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B087DYX55F'),
    rating: 4.4,
    description: 'ANC, 40h Akku, Komfort'
  },
  {
    id: 'bh-4',
    name: 'Sony WF-C700N',
    price: 79.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/51ZqGpGVbrL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B0C2N3J3VL'),
    rating: 4.2,
    description: 'TWS, ANC, kompakt'
  },
  {
    id: 'bh-5',
    name: 'Philips Audio TAT1206',
    price: 19.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/41v8DjGfgwL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B08SR5FKHD'),
    rating: 4.1,
    description: 'Budget-Option, 20h Akku'
  },
  {
    id: 'bh-6',
    name: 'OneOdio Monitor 60',
    price: 39.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/51LlWoJR-lL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B08F7GTSFN'),
    rating: 4.3,
    description: 'Studio-Sound, 30h Akku'
  },
  {
    id: 'bh-7',
    name: 'soundcore Space A40',
    price: 69.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/41AcSH3dppL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B0BWQFVXWX'),
    rating: 4.4,
    description: 'TWS, ANC, 10h Akku'
  },
  {
    id: 'bh-8',
    name: 'TaoTronics SoundSurge 90',
    price: 59.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/41gUHPIgHRL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B08SFHVB3Y'),
    rating: 4.2,
    description: 'ANC, 35h Akku'
  },
  {
    id: 'bh-9',
    name: 'Mpow H19 IPO',
    price: 49.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/51TnZRLYHHL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B088HWRCVZ'),
    rating: 4.1,
    description: 'ANC, 35h Akku, robust'
  },
  {
    id: 'bh-10',
    name: 'JBL Live Pro 2',
    price: 129.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/41GVZ8nLfAL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B0B4C5XXKS'),
    rating: 4.5,
    description: 'TWS, ANC, Premium'
  },
  {
    id: 'bh-11',
    name: 'Beats Studio Pro',
    price: 349.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/41ixmPL5ChL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B0BYM2J4J3'),
    rating: 4.6,
    description: 'Premium, ANC, 40h'
  },
  {
    id: 'bh-12',
    name: 'Sennheiser Momentum 4',
    price: 399.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/41Wk+gSHTnL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B0BQYTSGVH'),
    rating: 4.7,
    description: 'Ultra-Premium, 60h Akku'
  },
  {
    id: 'bh-13',
    name: 'Edifier W820NB',
    price: 79.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/51cEG3SXBVL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B08PKYLQ3G'),
    rating: 4.3,
    description: 'ANC, 35h Akku'
  },
  {
    id: 'bh-14',
    name: 'Anker Soundcore Liberty 4',
    price: 79.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/41AuGBmJKVL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B0BTZN3XN3'),
    rating: 4.4,
    description: 'TWS, ANC, 10h Akku'
  },
  {
    id: 'bh-15',
    name: 'Marshall Major IV',
    price: 199.99,
    budget: 30,
    image: 'https://m.media-amazon.com/images/I/41sTzrqpdBL._AC_SY240_.jpg',
    link: addAffiliateTag('https://www.amazon.de/dp/B08L9KKQSQ'),
    rating: 4.5,
    description: 'Iconic Design, 80h Akku'
  }
];

// Filtere Produkte nach Budget
export const getProductsByBudget = (maxBudget) => {
  return BLUETOOTH_HEADPHONES.filter(p => p.price <= maxBudget).sort((a, b) => a.price - b.price);
};

// Alle Kategorien
export const PRODUCT_CATEGORIES = {
  bluetooth_headphones: {
    name: 'Bluetooth Kopfhörer',
    emoji: '🎧',
    products: BLUETOOTH_HEADPHONES,
    description: 'Kabellose Kopfhörer für Musik & Anrufe'
  }
};
