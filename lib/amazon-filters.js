// Amazon Affiliate Filter Helper
// Generates dynamic Amazon search URLs with category and audience filters

const AFFILIATE_TAG = 'httpwwwspor03-21';
const BASE_URL = 'https://www.amazon.de/s';

// Audience filter mappings
export const AUDIENCES = {
  men: { label: '👨 Männer', value: 'men' },
  women: { label: '👩 Frauen', value: 'women' },
  kids: { label: '👧 Kinder', value: 'kids' },
  teenagers: { label: '👦 Teenager', value: 'teenagers' },
};

// Product category filter mappings
export const CATEGORIES = {
  electronics: { label: '📱 Elektronik', value: 'electronics' },
  gadgets: { label: '⚙️ Gadgets', value: 'gadgets' },
  games: { label: '🎮 Spiele', value: 'games' },
  books: { label: '📚 Bücher', value: 'books' },
  sports: { label: '⚽ Sport & Outdoor', value: 'sports' },
  fashion: { label: '👔 Mode & Accessoires', value: 'fashion' },
  home: { label: '🏠 Haushalt & Deko', value: 'home' },
  beauty: { label: '💄 Beauty & Wellness', value: 'beauty' },
  toys: { label: '🧸 Spielzeug', value: 'toys' },
};

// Generate search keywords based on filters
function getSearchKeywords(audience, category) {
  const keywords = [];

  // Audience keywords
  if (audience === 'men') keywords.push('herren geschenk');
  if (audience === 'women') keywords.push('damen geschenk');
  if (audience === 'kids') keywords.push('kinder geschenk');
  if (audience === 'teenagers') keywords.push('teenager geschenk');

  // Category keywords
  if (category === 'electronics') keywords.push('elektronik gadget');
  if (category === 'gadgets') keywords.push('nützliche gadgets');
  if (category === 'games') keywords.push('spiele');
  if (category === 'books') keywords.push('bücher');
  if (category === 'sports') keywords.push('sport outdoor');
  if (category === 'fashion') keywords.push('mode accessoires');
  if (category === 'home') keywords.push('haushalt deko');
  if (category === 'beauty') keywords.push('beauty wellness');
  if (category === 'toys') keywords.push('spielzeug');

  return keywords.length > 0 ? keywords.join(' ') : 'geschenkideen';
}

// Generate dynamic Amazon URL
export function generateAmazonUrl(priceRange, audience = null, category = null) {
  const searchKeyword = getSearchKeywords(audience, category);

  const params = new URLSearchParams({
    k: searchKeyword,
    linkCode: 'll2',
    tag: AFFILIATE_TAG,
    linkId: '352789827e8ff4245765ad12811dd59f',
    language: 'de_DE',
    ref_: 'as_li_ss_tl',
  });

  // Add price filter if specified
  if (priceRange) {
    params.append('rh', `p_price%3A${priceRange}`);
  }

  return `${BASE_URL}?${params.toString()}`;
}

// Price ranges in cents (for URL parameter)
export const PRICE_RANGES = {
  '1-5': '100-500',
  '5-10': '500-1000',
  '10-15': '1000-1500',
  '15-20': '1500-2000',
  '20-30': '2000-3000',
  '30-50': '3000-5000',
  '50-100': '5000-10000',
};

export const PRICE_LABELS = [
  { label: '1-5 €', range: '1-5' },
  { label: '5-10 €', range: '5-10' },
  { label: '10-15 €', range: '10-15' },
  { label: '15-20 €', range: '15-20' },
  { label: '20-30 €', range: '20-30' },
  { label: '30-50 €', range: '30-50' },
  { label: '50-100 €', range: '50-100' },
  { label: 'Alle Preise', range: null },
];
