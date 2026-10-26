export class AiError extends Error {
  constructor(reason, message) {
    super(message);
    this.reason = reason;
  }
}

const LABELS = {
  laptop: { name: 'Laptop', category: 'Elektronik', sub: 'Laptop' },
  'cell phone': { name: 'Handphone', category: 'Elektronik', sub: 'Handphone' },
  phone: { name: 'Handphone', category: 'Elektronik', sub: 'Handphone' },
  smartphone: { name: 'Handphone', category: 'Elektronik', sub: 'Handphone' },
  charger: { name: 'Charger', category: 'Elektronik', sub: 'Charger' },
  keyboard: { name: 'Keyboard', category: 'Elektronik', sub: null },
  mouse: { name: 'Mouse', category: 'Elektronik', sub: null },
  remote: { name: 'Remote', category: 'Elektronik', sub: null },
  tablet: { name: 'Tablet', category: 'Elektronik', sub: null },
  headphones: { name: 'Headphone', category: 'Elektronik', sub: null },
  earphones: { name: 'Earphone', category: 'Elektronik', sub: null },
  'power bank': { name: 'Power Bank', category: 'Elektronik', sub: null },
  backpack: { name: 'Tas Ransel', category: 'Aksesoris', sub: null },
  handbag: { name: 'Tas Tangan', category: 'Aksesoris', sub: null },
  suitcase: { name: 'Koper', category: 'Aksesoris', sub: null },
  wallet: { name: 'Dompet', category: 'Aksesoris', sub: null },
  watch: { name: 'Jam Tangan', category: 'Aksesoris', sub: null },
  clock: { name: 'Jam', category: 'Aksesoris', sub: null },
  glasses: { name: 'Kacamata', category: 'Aksesoris', sub: null },
  eyeglasses: { name: 'Kacamata', category: 'Aksesoris', sub: null },
  hat: { name: 'Topi', category: 'Aksesoris', sub: null },
  cap: { name: 'Topi', category: 'Aksesoris', sub: null },
  jacket: { name: 'Jaket', category: 'Pakaian', sub: null },
  hoodie: { name: 'Hoodie', category: 'Pakaian', sub: null },
  shirt: { name: 'Kemeja', category: 'Pakaian', sub: null },
  't shirt': { name: 'Kaos', category: 'Pakaian', sub: null },
  sweater: { name: 'Sweater', category: 'Pakaian', sub: null },
  pants: { name: 'Celana', category: 'Pakaian', sub: null },
  jeans: { name: 'Celana Jeans', category: 'Pakaian', sub: null },
  shoe: { name: 'Sepatu', category: 'Pakaian', sub: null },
  shoes: { name: 'Sepatu', category: 'Pakaian', sub: null },
  tie: { name: 'Dasi', category: 'Pakaian', sub: null },
  pen: { name: 'Pulpen', category: 'Alat Tulis', sub: null },
  pencil: { name: 'Pensil', category: 'Alat Tulis', sub: null },
  ruler: { name: 'Penggaris', category: 'Alat Tulis', sub: null },
  book: { name: 'Buku', category: 'Alat Tulis', sub: null },
  notebook: { name: 'Buku Catatan', category: 'Alat Tulis', sub: null },
  scissors: { name: 'Gunting', category: 'Alat Tulis', sub: null },
  'pencil case': { name: 'Tempat Pensil', category: 'Alat Tulis', sub: null },
  umbrella: { name: 'Payung', category: 'Others', sub: null },
  bottle: { name: 'Botol Minum', category: 'Others', sub: null },
  'water bottle': { name: 'Botol Minum', category: 'Others', sub: null },
  cup: { name: 'Gelas', category: 'Others', sub: null },
};

const COLOR_NAMES = {
  merah: 'Merah',
  red: 'Merah',
  kuning: 'Kuning',
  yellow: 'Kuning',
  biru: 'Biru',
  blue: 'Biru',
  hijau: 'Hijau',
  green: 'Hijau',
  hitam: 'Hitam',
  black: 'Hitam',
  putih: 'Putih',
  white: 'Putih',
  abu: 'Abu-abu',
  'abu abu': 'Abu-abu',
  gray: 'Abu-abu',
  grey: 'Abu-abu',
  cokelat: 'Cokelat',
  coklat: 'Cokelat',
  brown: 'Cokelat',
};

function normalizeKey(text) {
  return String(text).toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function titleCase(text) {
  return normalizeKey(text).replace(/\b\w/g, (c) => c.toUpperCase());
}

export function lookupLabel(label) {
  const key = normalizeKey(label);
  if (Object.hasOwn(LABELS, key)) return LABELS[key];
  return { name: titleCase(label), category: 'Others', sub: null };
}

function parseHex(hex) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!match) return null;
  const n = parseInt(match[1], 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h = (h * 60 + 360) % 360;
  return { h, s, l };
}

export function classifyHex(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const { h, s, l } = rgbToHsl(rgb);

  if (l < 0.15) return 'Hitam';
  if (l > 0.92) return 'Putih';
  if (s < 0.18) {
    if (l > 0.8) return 'Putih';
    if (l < 0.3) return 'Hitam';
    return 'Abu-abu';
  }
  if (h < 15 || h >= 345) return 'Merah';
  if (h < 45) return l < 0.45 ? 'Cokelat' : null;
  if (h < 70) return 'Kuning';
  if (h < 170) return 'Hijau';
  if (h >= 190 && h < 255) return 'Biru';
  return null;
}

export function mapColorName(color) {
  const key = normalizeKey(color.name || '');
  if (key && Object.hasOwn(COLOR_NAMES, key)) return COLOR_NAMES[key];
  return classifyHex(color.hex || '');
}

export function normalizeAiResponse(raw) {
  if (!raw || typeof raw !== 'object') {
    throw new AiError('unavailable', 'Respons AI tidak valid');
  }
  const label = typeof raw.label === 'string' && raw.label.trim() ? raw.label.trim() : null;
  const scoreNumber = Number(raw.score);
  const score = Number.isFinite(scoreNumber) ? Math.min(1, Math.max(0, scoreNumber)) : 0;

  const colors = Array.isArray(raw.colors)
    ? raw.colors.map((c) => ({
        name: typeof c?.name === 'string' ? c.name : '',
        hex: typeof c?.hex === 'string' ? c.hex : '',
        ratio: Number(c?.ratio) || 0,
      }))
    : [];

  const detections = Array.isArray(raw.detections)
    ? raw.detections
        .filter((d) => d && typeof d.label === 'string')
        .map((d) => ({ label: d.label, score: Number(d.score) || 0 }))
    : [];

  return { label, score, colors, detections };
}

export function emptyDraft(reason) {
  return {
    aiAvailable: reason === 'no_detection',
    reason,
    label: null,
    name: null,
    description: null,
    categoryId: null,
    subcategoryId: null,
    colorId: null,
    colorName: null,
    aiConfidence: null,
    lowConfidence: false,
  };
}

export function buildDraft(ai, { categories, colors }) {
  if (!ai.label) return emptyDraft('no_detection');

  const mapping = lookupLabel(ai.label);
  const category =
    categories.find((c) => c.name.toLowerCase() === mapping.category.toLowerCase()) ||
    categories.find((c) => c.name.toLowerCase() === 'others') ||
    null;
  const subcategory =
    category && mapping.sub
      ? category.subcategories.find((s) => s.name.toLowerCase() === mapping.sub.toLowerCase()) || null
      : null;

  const topColor = [...ai.colors].sort((a, b) => b.ratio - a.ratio)[0];
  const colorName = topColor ? mapColorName(topColor) : null;
  const color = colorName ? colors.find((c) => c.name.toLowerCase() === colorName.toLowerCase()) || null : null;

  return {
    aiAvailable: true,
    reason: null,
    label: ai.label,
    name: colorName ? `${mapping.name} ${colorName}` : mapping.name,
    description: colorName ? `${mapping.name} berwarna ${colorName.toLowerCase()}.` : null,
    categoryId: category ? category.id : null,
    subcategoryId: subcategory ? subcategory.id : null,
    colorId: color ? color.id : null,
    colorName,
    aiConfidence: ai.score,
    lowConfidence: ai.score < 0.4,
  };
}
