import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

const categories = [
  { id: 1, name: 'Pakaian', subcategories: [] },
  {
    id: 3,
    name: 'Elektronik',
    subcategories: [
      { id: 1, name: 'Handphone' },
      { id: 2, name: 'Charger' },
    ],
  },
];
const colors = [
  { id: 1, name: 'Merah', hex: '#FF0000' },
  { id: 3, name: 'Biru', hex: '#0000FF' },
];
const item = {
  id: 1,
  code: 'LNF-2026-0001',
  name: 'Charger Laptop ASUS',
  description: 'Charger 65W',
  category: { id: 3, name: 'Elektronik' },
  subcategory: { id: 2, name: 'Charger' },
  color: null,
  photoUrl: 'http://localhost:3000/uploads/items/a.jpg',
  foundLocation: 'Gedung A Lantai 2',
  foundAt: '2026-10-13T07:36:10.262Z',
  status: 'available',
};

function respond(body, status = 200) {
  return Promise.resolve({ ok: status < 400, status, json: async () => body });
}

let calls;

beforeEach(() => {
  calls = [];
  vi.stubGlobal(
    'fetch',
    vi.fn((url) => {
      const text = String(url);
      calls.push(text);
      if (text.startsWith('/api/categories')) return respond({ data: categories });
      if (text.startsWith('/api/colors')) return respond({ data: colors });
      if (text.startsWith('/api/pos-locations')) {
        return respond({
          data: [{ id: 1, name: 'Ruangan Logistik A1', description: 'Telkom University Surabaya', mapUrl: null }],
        });
      }
      if (text.startsWith('/api/items/999')) return respond({ error: 'Barang tidak ditemukan' }, 404);
      if (text.startsWith('/api/items/1')) {
        return respond({
          data: {
            ...item,
            pickupLocation: { name: 'Ruangan Logistik A1', description: 'Telkom University Surabaya', mapUrl: null },
          },
        });
      }
      if (text.startsWith('/api/items')) {
        return respond({ data: [item], meta: { page: 1, limit: 12, total: 1, totalPages: 1 } });
      }
      return respond({ error: 'not mocked' }, 500);
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe('katalog publik', () => {
  it('menampilkan highlight minggu ini dan semua barang', async () => {
    renderAt('/');
    expect(await screen.findByText('Highlight Barang Hilang Minggu ini')).toBeTruthy();
    expect((await screen.findAllByText('Charger Laptop ASUS')).length).toBe(2);
    expect(calls.some((c) => c.includes('period=week'))).toBe(true);
    expect(screen.getAllByText('Tersedia').length).toBeGreaterThan(0);
  });

  it('mengirim kata kunci pencarian ke API setelah jeda mengetik', async () => {
    renderAt('/');
    await screen.findAllByText('Charger Laptop ASUS');
    fireEvent.change(screen.getByLabelText('Cari barang'), { target: { value: 'jaket' } });
    await waitFor(() => expect(calls.some((c) => c.includes('search=jaket'))).toBe(true), { timeout: 3000 });
    expect(await screen.findByText('Hasil Pencarian')).toBeTruthy();
  });

  it('menampilkan subkategori setelah kategori dipilih', async () => {
    renderAt('/');
    await screen.findAllByText('Charger Laptop ASUS');
    fireEvent.click(screen.getByRole('button', { name: /Filter/ }));
    const elektronik = await screen.findByRole('button', { name: 'Elektronik' });
    expect(screen.queryByText('Sub Category')).toBeNull();
    fireEvent.click(elektronik);
    expect(await screen.findByText('Sub Category')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Charger' })).toBeTruthy();
    await waitFor(() => expect(calls.some((c) => c.includes('category=Elektronik'))).toBe(true));
  });

  it('memfilter warna lewat chip warna', async () => {
    renderAt('/');
    fireEvent.click(await screen.findByRole('button', { name: 'Merah' }));
    await waitFor(() => expect(calls.some((c) => c.includes('color=Merah'))).toBe(true));
  });
});

describe('detail barang', () => {
  it('menampilkan lokasi pengambilan dan reminder', async () => {
    renderAt('/items/1');
    expect(await screen.findByText('Lokasi Pengambilan')).toBeTruthy();
    expect(screen.getByText(/Ruangan Logistik A1/)).toBeTruthy();
    expect(screen.getByText('Membawa KTM dan Bukti Kepemilikan')).toBeTruthy();
    expect(screen.getByText('Kode: LNF-2026-0001')).toBeTruthy();
  });

  it('menampilkan pesan saat barang tidak ditemukan', async () => {
    renderAt('/items/999');
    expect(await screen.findByText('Barang tidak ditemukan.')).toBeTruthy();
  });
});

describe('halaman lain', () => {
  it('menampilkan daftar pos location', async () => {
    renderAt('/pos-location');
    expect(await screen.findByText('Ruangan Logistik A1')).toBeTruthy();
  });

  it('menampilkan manual book', () => {
    renderAt('/manual-book');
    expect(screen.getByText('Manual Book', { selector: 'h1' })).toBeTruthy();
  });
});
