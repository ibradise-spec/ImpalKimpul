import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  AiError,
  buildDraft,
  classifyHex,
  emptyDraft,
  lookupLabel,
  mapColorName,
  normalizeAiResponse,
} from '../src/lib/aiMapping.js';

const categories = [
  { id: 1, name: 'Pakaian', subcategories: [] },
  { id: 2, name: 'Aksesoris', subcategories: [] },
  {
    id: 3,
    name: 'Elektronik',
    subcategories: [
      { id: 1, name: 'Handphone' },
      { id: 2, name: 'Charger' },
      { id: 3, name: 'Laptop' },
    ],
  },
  { id: 4, name: 'Alat Tulis', subcategories: [] },
  { id: 5, name: 'Others', subcategories: [] },
];
const colors = [
  { id: 1, name: 'Merah', hex: '#FF0000' },
  { id: 2, name: 'Kuning', hex: '#FFFF00' },
  { id: 3, name: 'Biru', hex: '#0000FF' },
];

describe('classifyHex', () => {
  const cases = [
    ['#FF0000', 'Merah'],
    ['#C8102E', 'Merah'],
    ['#FFFF00', 'Kuning'],
    ['#1F3A93', 'Biru'],
    ['#2E8B57', 'Hijau'],
    ['#000000', 'Hitam'],
    ['#1B1B1B', 'Hitam'],
    ['#FFFFFF', 'Putih'],
    ['#808080', 'Abu-abu'],
    ['#8B4513', 'Cokelat'],
    ['#FFA500', null],
    ['bukan-hex', null],
  ];
  for (const [hex, expected] of cases) {
    it(`${hex} menjadi ${expected}`, () => {
      assert.equal(classifyHex(hex), expected);
    });
  }
});

describe('mapColorName', () => {
  it('memakai nama dari Jingga bila dikenali (Indonesia atau Inggris)', () => {
    assert.equal(mapColorName({ name: 'Biru', hex: '#FF0000' }), 'Biru');
    assert.equal(mapColorName({ name: 'red', hex: '' }), 'Merah');
    assert.equal(mapColorName({ name: 'abu-abu', hex: '' }), 'Abu-abu');
  });

  it('jatuh ke klasifikasi hex bila nama tidak dikenali', () => {
    assert.equal(mapColorName({ name: 'navy', hex: '#1F3A93' }), 'Biru');
  });
});

describe('lookupLabel', () => {
  it('memetakan label dikenal ke kategori dan subkategori', () => {
    assert.deepEqual(lookupLabel('cell phone'), { name: 'Handphone', category: 'Elektronik', sub: 'Handphone' });
    assert.equal(lookupLabel('Backpack').category, 'Aksesoris');
  });

  it('menganggap label tidak dikenal sebagai Others', () => {
    assert.deepEqual(lookupLabel('traffic_light'), { name: 'Traffic Light', category: 'Others', sub: null });
  });

  it('tidak tertipu nama properti bawaan objek', () => {
    assert.equal(lookupLabel('constructor').category, 'Others');
  });
});

describe('normalizeAiResponse', () => {
  it('merapikan respons yang valid', () => {
    const result = normalizeAiResponse({
      label: ' laptop ',
      score: 1.7,
      colors: [{ name: 'biru', hex: '#1F3A93', ratio: '0.6' }],
      detections: [{ label: 'laptop', score: 0.9 }, { nope: true }],
    });
    assert.equal(result.label, 'laptop');
    assert.equal(result.score, 1);
    assert.equal(result.colors[0].ratio, 0.6);
    assert.equal(result.detections.length, 1);
  });

  it('menganggap label kosong sebagai tidak ada deteksi', () => {
    assert.equal(normalizeAiResponse({ label: null }).label, null);
    assert.equal(normalizeAiResponse({ label: '  ' }).label, null);
  });

  it('menolak respons yang bukan objek', () => {
    assert.throws(() => normalizeAiResponse(null), AiError);
    assert.throws(() => normalizeAiResponse('teks'), AiError);
  });
});

describe('buildDraft', () => {
  it('mengisi kategori, subkategori, warna, nama, dan deskripsi', () => {
    const draft = buildDraft(
      { label: 'laptop', score: 0.91, colors: [{ name: 'biru', hex: '#1F3A93', ratio: 0.62 }], detections: [] },
      { categories, colors },
    );
    assert.equal(draft.aiAvailable, true);
    assert.equal(draft.categoryId, 3);
    assert.equal(draft.subcategoryId, 3);
    assert.equal(draft.colorId, 3);
    assert.equal(draft.name, 'Laptop Biru');
    assert.equal(draft.description, 'Laptop berwarna biru.');
    assert.equal(draft.aiConfidence, 0.91);
    assert.equal(draft.lowConfidence, false);
  });

  it('mengosongkan colorId bila warna belum ada di database tapi tetap menyebut warnanya', () => {
    const draft = buildDraft(
      { label: 'backpack', score: 0.8, colors: [{ name: 'hitam', hex: '#1B1B1B', ratio: 0.7 }], detections: [] },
      { categories, colors },
    );
    assert.equal(draft.colorId, null);
    assert.equal(draft.colorName, 'Hitam');
    assert.equal(draft.name, 'Tas Ransel Hitam');
    assert.equal(draft.categoryId, 2);
  });

  it('memakai warna dengan rasio terbesar', () => {
    const draft = buildDraft(
      {
        label: 'umbrella',
        score: 0.7,
        colors: [
          { name: 'putih', hex: '#FFFFFF', ratio: 0.1 },
          { name: 'kuning', hex: '#F2C500', ratio: 0.8 },
        ],
        detections: [],
      },
      { categories, colors },
    );
    assert.equal(draft.colorId, 2);
  });

  it('menandai keyakinan rendah', () => {
    const draft = buildDraft({ label: 'bottle', score: 0.34, colors: [], detections: [] }, { categories, colors });
    assert.equal(draft.lowConfidence, true);
    assert.equal(draft.description, null);
    assert.equal(draft.categoryId, 5);
  });

  it('mengembalikan draf kosong bila tidak ada objek terdeteksi', () => {
    const draft = buildDraft({ label: null, score: 0, colors: [], detections: [] }, { categories, colors });
    assert.deepEqual(draft, emptyDraft('no_detection'));
    assert.equal(draft.aiAvailable, true);
  });

  it('draf gagal menandai AI tidak tersedia', () => {
    assert.equal(emptyDraft('timeout').aiAvailable, false);
    assert.equal(emptyDraft('timeout').reason, 'timeout');
  });
});
