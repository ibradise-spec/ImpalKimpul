import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App.jsx';

const admin = { id: 1, email: 'admin@student.telkomuniversity.ac.id', name: 'Admin Logistik' };
const categories = [
  { id: 1, name: 'Pakaian', subcategories: [] },
  { id: 3, name: 'Elektronik', subcategories: [{ id: 2, name: 'Charger' }] },
];
const colors = [{ id: 1, name: 'Merah', hex: '#FF0000' }];

function makeItem(id, name, extra = {}) {
  return {
    id,
    code: `LNF-2026-${String(id).padStart(4, '0')}`,
    name,
    description: `Deskripsi ${name}`,
    category: categories[1],
    subcategory: null,
    color: null,
    photoUrl: 'http://localhost:3000/uploads/items/a.jpg',
    foundLocation: 'Kantin',
    foundAt: '2026-10-13T07:36:10.262Z',
    status: 'available',
    aiConfidence: null,
    createdBy: admin,
    handover: null,
    ...extra,
  };
}

function json(body, status = 200) {
  return Promise.resolve({ ok: status < 400, status, json: async () => body });
}

let state;

function installServer(options = {}) {
  state = {
    authed: options.authed ?? true,
    itemsUnauthorized: options.itemsUnauthorized ?? false,
    analyze: options.analyze ?? {
      data: {
        aiAvailable: true,
        reason: null,
        label: 'laptop',
        name: 'Laptop Merah',
        description: 'Laptop berwarna merah.',
        categoryId: 3,
        subcategoryId: 2,
        colorId: 1,
        colorName: 'Merah',
        aiConfidence: 0.91,
        lowConfidence: false,
      },
    },
    items: [makeItem(1, 'Charger Laptop ASUS'), makeItem(2, 'Jaket Hoodie Merah', { status: 'taken', handover: { takerName: 'Budi', takerNim: '2203041001', ktmVerified: true } })],
    calls: [],
  };

  vi.stubGlobal(
    'fetch',
    vi.fn((url, init = {}) => {
      const method = init.method || 'GET';
      const path = String(url).split('?')[0];
      state.calls.push({ method, url: String(url), body: init.body });

      if (path === '/api/auth/me') return state.authed ? json({ admin }) : json({ error: 'Silakan login terlebih dahulu' }, 401);
      if (path === '/api/auth/login') {
        const body = JSON.parse(init.body);
        if (body.password === 'benar') {
          state.authed = true;
          return json({ admin });
        }
        return json({ error: 'Email atau password salah' }, 401);
      }
      if (path === '/api/auth/logout') {
        state.authed = false;
        return json({ message: 'Berhasil logout' });
      }
      if (path === '/api/categories') return json({ data: categories });
      if (path === '/api/colors') return json({ data: colors });

      if (!state.authed || (state.itemsUnauthorized && path.startsWith('/api/admin/items') && method === 'GET')) {
        return json({ error: 'Silakan login terlebih dahulu' }, 401);
      }

      if (path === '/api/admin/stats') {
        return json({ data: { total: 12, available: 9, taken: 3 } });
      }
      if (path === '/api/admin/items/analyze' && method === 'POST') {
        return json(state.analyze);
      }
      if (path === '/api/admin/items' && method === 'GET') {
        return json({ data: state.items, meta: { page: 1, limit: 15, total: state.items.length, totalPages: 1 } });
      }
      if (path === '/api/admin/items' && method === 'POST') {
        const created = makeItem(13, init.body.get('name'));
        state.items.push(created);
        return json({ data: created }, 201);
      }
      const handover = path.match(/^\/api\/admin\/items\/(\d+)\/handover$/);
      if (handover && method === 'POST') {
        const item = state.items.find((i) => i.id === Number(handover[1]));
        item.status = 'taken';
        return json({ data: item }, 201);
      }
      const single = path.match(/^\/api\/admin\/items\/(\d+)$/);
      if (single && method === 'PATCH') {
        const item = state.items.find((i) => i.id === Number(single[1]));
        item.name = init.body.get('name');
        return json({ data: item });
      }
      if (single && method === 'DELETE') {
        state.items = state.items.filter((i) => i.id !== Number(single[1]));
        return json({ message: 'Barang berhasil dihapus' });
      }
      return json({ error: 'not mocked' }, 500);
    }),
  );
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:preview');
  URL.revokeObjectURL = vi.fn();
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

describe('login dan penjaga rute', () => {
  it('mengarahkan ke halaman login jika belum masuk', async () => {
    installServer({ authed: false });
    renderAt('/admin');
    expect(await screen.findByRole('heading', { name: 'Masuk Admin' })).toBeTruthy();
  });

  it('menampilkan pesan error saat password salah', async () => {
    installServer({ authed: false });
    renderAt('/admin/login');
    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: admin.email } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'salah' } });
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByRole('alert')).toBeTruthy();
    expect(screen.getByText('Email atau password salah')).toBeTruthy();
  });

  it('masuk ke dashboard dan menampilkan statistik setelah login benar', async () => {
    installServer({ authed: false });
    renderAt('/admin');
    fireEvent.change(await screen.findByLabelText('Email'), { target: { value: admin.email } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'benar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Masuk' }));
    expect(await screen.findByText('TOTAL BARANG')).toBeTruthy();
    expect(await screen.findByText('12')).toBeTruthy();
    expect(screen.getByText('9')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('kembali ke login saat sesi berakhir di tengah penggunaan', async () => {
    installServer({ authed: true, itemsUnauthorized: true });
    renderAt('/admin/inventaris');
    expect(await screen.findByRole('heading', { name: 'Masuk Admin' })).toBeTruthy();
  });

  it('keluar lewat menu akun', async () => {
    installServer();
    renderAt('/admin');
    await screen.findByText('TOTAL BARANG');
    fireEvent.click(screen.getByRole('button', { name: 'Menu akun' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Keluar/ }));
    expect(await screen.findByRole('heading', { name: 'Masuk Admin' })).toBeTruthy();
    expect(state.calls.some((c) => c.url === '/api/auth/logout' && c.method === 'POST')).toBe(true);
  });
});

describe('inventaris', () => {
  it('menampilkan daftar barang beserta data pengambil', async () => {
    installServer();
    renderAt('/admin/inventaris');
    expect(await screen.findByText('Charger Laptop ASUS')).toBeTruthy();
    expect(screen.getByText('LNF-2026-0002')).toBeTruthy();
    expect(screen.getByText('Budi (2203041001)')).toBeTruthy();
  });

  it('mengirim kata kunci dan urutan ke API', async () => {
    installServer();
    renderAt('/admin/inventaris');
    await screen.findByText('Charger Laptop ASUS');
    fireEvent.change(screen.getByLabelText('Cari di inventaris'), { target: { value: 'charger' } });
    await waitFor(() => expect(state.calls.some((c) => c.url.includes('search=charger'))).toBe(true), { timeout: 3000 });
    fireEvent.click(screen.getByRole('button', { name: /Kode/ }));
    await waitFor(() => expect(state.calls.some((c) => c.url.includes('sort=code') && c.url.includes('order=asc'))).toBe(true));
  });

  it('menandai barang diambil lewat menu aksi', async () => {
    installServer();
    renderAt('/admin/inventaris');
    await screen.findByText('Charger Laptop ASUS');
    fireEvent.click(screen.getByRole('button', { name: 'Aksi untuk Charger Laptop ASUS' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Tandai Diambil/ }));

    const dialog = await screen.findByRole('dialog');
    const submit = within(dialog).getByRole('button', { name: 'Simpan Serah Terima' });
    expect(submit.disabled).toBe(true);

    fireEvent.change(within(dialog).getByLabelText('Nama Pengambil'), { target: { value: 'Siti' } });
    fireEvent.change(within(dialog).getByLabelText('NIM Pengambil'), { target: { value: '2203049999' } });
    fireEvent.click(within(dialog).getByLabelText(/memverifikasi KTM/));
    expect(submit.disabled).toBe(false);
    fireEvent.click(submit);

    await waitFor(() => expect(state.calls.some((c) => c.url === '/api/admin/items/1/handover' && c.method === 'POST')).toBe(true));
    const call = state.calls.find((c) => c.url === '/api/admin/items/1/handover');
    expect(JSON.parse(call.body)).toEqual({ takerName: 'Siti', takerNim: '2203049999', ktmVerified: true });
    expect(await screen.findByText('Charger Laptop ASUS ditandai sudah diambil')).toBeTruthy();
  });

  it('mengedit barang lewat modal dan mengirim PATCH', async () => {
    installServer();
    renderAt('/admin/inventaris');
    await screen.findByText('Charger Laptop ASUS');
    fireEvent.click(screen.getByRole('button', { name: 'Aksi untuk Charger Laptop ASUS' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Edit/ }));

    const dialog = await screen.findByRole('dialog');
    const nameInput = await within(dialog).findByLabelText('Nama Barang');
    expect(nameInput.value).toBe('Charger Laptop ASUS');
    fireEvent.change(nameInput, { target: { value: 'Charger ASUS 65W' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Simpan Perubahan' }));

    await waitFor(() => expect(state.calls.some((c) => c.method === 'PATCH' && c.url === '/api/admin/items/1')).toBe(true));
    const body = state.calls.find((c) => c.method === 'PATCH').body;
    expect(body.get('name')).toBe('Charger ASUS 65W');
    expect(body.has('photo')).toBe(false);
    expect(await screen.findByText('Perubahan disimpan')).toBeTruthy();
    expect(await screen.findByText('Charger ASUS 65W')).toBeTruthy();
  });

  it('menghapus barang setelah konfirmasi', async () => {
    installServer();
    renderAt('/admin/inventaris');
    await screen.findByText('Charger Laptop ASUS');
    fireEvent.click(screen.getByRole('button', { name: 'Aksi untuk Charger Laptop ASUS' }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Hapus/ }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hapus' }));
    await waitFor(() => expect(state.calls.some((c) => c.method === 'DELETE' && c.url === '/api/admin/items/1')).toBe(true));
    await waitFor(() => expect(screen.queryByText('Charger Laptop ASUS')).toBeNull());
  });

  it('menghapus beberapa barang terpilih sekaligus', async () => {
    installServer();
    renderAt('/admin/inventaris');
    await screen.findByText('Charger Laptop ASUS');
    fireEvent.click(screen.getByLabelText('Pilih semua'));
    expect(screen.getByText('2 barang dipilih')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Hapus terpilih' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Hapus Semua' }));
    await waitFor(() => expect(state.calls.filter((c) => c.method === 'DELETE').length).toBe(2));
  });
});

describe('tambah barang', () => {
  it('menolak submit tanpa foto', async () => {
    installServer();
    renderAt('/admin/add-item');
    await screen.findByLabelText('Nama Barang');
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    expect(await screen.findByText('Foto barang wajib diunggah')).toBeTruthy();
    expect(state.calls.some((c) => c.method === 'POST')).toBe(false);
  });

  it('menolak format file yang tidak didukung', async () => {
    installServer();
    renderAt('/admin/add-item');
    await screen.findByLabelText('Nama Barang');
    const file = new File(['x'], 'catatan.txt', { type: 'text/plain' });
    fireEvent.change(screen.getByLabelText('Foto barang'), { target: { files: [file] } });
    expect(await screen.findByText('Format foto harus JPG, PNG, atau WEBP')).toBeTruthy();
  });

  it('mengirim multipart ke API dan kembali ke inventaris', async () => {
    installServer();
    renderAt('/admin/add-item');
    await screen.findByLabelText('Nama Barang');

    const file = new File(['isi'], 'dompet.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Foto barang'), { target: { files: [file] } });
    expect(await screen.findByAltText('Pratinjau foto barang')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Nama Barang'), { target: { value: 'Dompet Hitam' } });
    fireEvent.change(screen.getByLabelText('Kategori'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Subkategori'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Lokasi Penemuan'), { target: { value: 'Kantin' } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => expect(state.calls.some((c) => c.method === 'POST' && c.url === '/api/admin/items')).toBe(true));
    const body = state.calls.find((c) => c.method === 'POST' && c.url === '/api/admin/items').body;
    expect(body.get('name')).toBe('Dompet Hitam');
    expect(body.get('categoryId')).toBe('3');
    expect(body.get('subcategoryId')).toBe('2');
    expect(body.get('foundLocation')).toBe('Kantin');
    expect(body.get('photo').name).toBe('dompet.jpg');
    expect(body.has('foundAt')).toBe(false);

    expect(await screen.findByRole('heading', { name: 'Inventaris' })).toBeTruthy();
    expect(await screen.findByText('Barang LNF-2026-0013 berhasil ditambahkan')).toBeTruthy();
  });
});

describe('autofill AI di form tambah barang', () => {
  function pickPhoto() {
    const file = new File(['isi'], 'foto.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Foto barang'), { target: { files: [file] } });
  }

  it('mengisi nama, deskripsi, kategori, subkategori, dan warna dari hasil analisis', async () => {
    installServer();
    renderAt('/admin/add-item');
    await screen.findByLabelText('Nama Barang');
    pickPhoto();

    expect(await screen.findByText(/AI mengisi otomatis: Laptop Merah \(91%\)/)).toBeTruthy();
    expect(screen.getByLabelText('Nama Barang').value).toBe('Laptop Merah');
    expect(screen.getByLabelText('Deskripsi').value).toBe('Laptop berwarna merah.');
    expect(screen.getByLabelText('Kategori').value).toBe('3');
    expect(screen.getByLabelText('Subkategori').value).toBe('2');
    expect(screen.getByLabelText('Warna').value).toBe('1');
    expect(state.calls.some((c) => c.url === '/api/admin/items/analyze' && c.body.get('photo'))).toBe(true);

    fireEvent.change(screen.getByLabelText('Lokasi Penemuan'), { target: { value: 'Perpustakaan' } });
    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));
    await waitFor(() => expect(state.calls.some((c) => c.method === 'POST' && c.url === '/api/admin/items')).toBe(true));
    const body = state.calls.find((c) => c.method === 'POST' && c.url === '/api/admin/items').body;
    expect(body.get('aiConfidence')).toBe('0.91');
    expect(body.get('name')).toBe('Laptop Merah');
  });

  it('tidak menimpa isian yang sudah diubah admin', async () => {
    installServer();
    renderAt('/admin/add-item');
    fireEvent.change(await screen.findByLabelText('Nama Barang'), { target: { value: 'Laptop Punya Budi' } });
    pickPhoto();

    await screen.findByText(/AI mengisi otomatis/);
    expect(screen.getByLabelText('Nama Barang').value).toBe('Laptop Punya Budi');
    expect(screen.getByLabelText('Kategori').value).toBe('3');
  });

  it('memperingatkan saat keyakinan AI rendah', async () => {
    installServer({
      analyze: {
        data: {
          aiAvailable: true, reason: null, label: 'bottle', name: 'Botol Minum', description: null,
          categoryId: 1, subcategoryId: null, colorId: null, colorName: 'Hitam', aiConfidence: 0.3, lowConfidence: true,
        },
      },
    });
    renderAt('/admin/add-item');
    await screen.findByLabelText('Nama Barang');
    pickPhoto();
    expect(await screen.findByText('Keyakinan AI rendah, periksa kembali semua isian.')).toBeTruthy();
    expect(screen.getByText('Warna terdeteksi Hitam, tetapi belum tersedia di daftar warna.')).toBeTruthy();
  });

  it('tetap bisa diisi manual saat AI tidak tersedia', async () => {
    installServer({ analyze: { data: { aiAvailable: false, reason: 'timeout', label: null } } });
    renderAt('/admin/add-item');
    await screen.findByLabelText('Nama Barang');
    pickPhoto();
    expect(await screen.findByText('AI tidak tersedia saat ini. Isi detail secara manual.')).toBeTruthy();
    expect(screen.getByLabelText('Nama Barang').value).toBe('');
    fireEvent.change(screen.getByLabelText('Nama Barang'), { target: { value: 'Dompet' } });
    expect(screen.getByLabelText('Nama Barang').value).toBe('Dompet');
  });

  it('memberi tahu saat AI tidak mengenali objek', async () => {
    installServer({ analyze: { data: { aiAvailable: true, reason: 'no_detection', label: null } } });
    renderAt('/admin/add-item');
    await screen.findByLabelText('Nama Barang');
    pickPhoto();
    expect(await screen.findByText('AI tidak mengenali objek di foto. Isi detail secara manual.')).toBeTruthy();
  });
});
