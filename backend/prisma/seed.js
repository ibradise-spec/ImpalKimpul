import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: 'Pakaian', subs: [] },
  { name: 'Aksesoris', subs: [] },
  { name: 'Elektronik', subs: ['Handphone', 'Charger', 'Laptop'] },
  { name: 'Alat Tulis', subs: [] },
  { name: 'Others', subs: [] },
];

const colors = [
  { name: 'Merah', hex: '#FF0000' },
  { name: 'Kuning', hex: '#FFFF00' },
  { name: 'Biru', hex: '#0000FF' },
];

async function seedCatalogData() {
  for (const c of categories) {
    const category = await prisma.category.upsert({
      where: { name: c.name },
      update: {},
      create: { name: c.name },
    });
    for (const sub of c.subs) {
      await prisma.subcategory.upsert({
        where: { categoryId_name: { categoryId: category.id, name: sub } },
        update: {},
        create: { categoryId: category.id, name: sub },
      });
    }
  }

  for (const color of colors) {
    await prisma.color.upsert({
      where: { name: color.name },
      update: { hex: color.hex },
      create: color,
    });
  }

  const posName = 'Ruangan Logistik A1';
  const existingPos = await prisma.posLocation.findFirst({ where: { name: posName } });
  if (!existingPos) {
    await prisma.posLocation.create({
      data: { name: posName, description: 'Telkom University Surabaya' },
    });
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    console.warn('ADMIN_EMAIL atau ADMIN_PASSWORD kosong, akun admin tidak dibuat');
    return;
  }
  if (password.length < 8) {
    console.warn('ADMIN_PASSWORD minimal 8 karakter, akun admin tidak dibuat');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, isActive: true },
    create: { email, name: 'Admin Logistik', passwordHash },
  });
  console.log(`Admin siap: ${email}`);
}

const sampleItems = [
  { name: 'Charger Laptop ASUS', description: 'Charger laptop ASUS 65W, kabel hitam, ada stiker nama di adaptor', category: 'Elektronik', sub: 'Charger', color: null, foundLocation: 'Gedung A Lantai 2', daysAgo: 1 },
  { name: 'Handphone Samsung Case Merah', description: 'HP Samsung dengan case silikon merah, layar retak di pojok kanan atas', category: 'Elektronik', sub: 'Handphone', color: 'Merah', foundLocation: 'Kantin', daysAgo: 2 },
  { name: 'Laptop Lenovo Stiker Biru', description: 'Laptop Lenovo 14 inci, bagian belakang ada stiker biru bertuliskan Informatika', category: 'Elektronik', sub: 'Laptop', color: 'Biru', foundLocation: 'Perpustakaan', daysAgo: 3 },
  { name: 'Jaket Hoodie Merah', description: 'Hoodie merah ukuran L, ada tulisan di bagian dada', category: 'Pakaian', sub: null, color: 'Merah', foundLocation: 'Lapangan Basket', daysAgo: 1 },
  { name: 'Jaket Jeans Biru', description: 'Jaket jeans biru tua ukuran M, ada tambalan di lengan kiri', category: 'Pakaian', sub: null, color: 'Biru', foundLocation: 'Gedung B Lantai 1', daysAgo: 5 },
  { name: 'Topi Kuning', description: 'Topi baseball kuning dengan logo kecil di depan', category: 'Aksesoris', sub: null, color: 'Kuning', foundLocation: 'Parkiran Motor', daysAgo: 4 },
  { name: 'Kacamata Frame Hitam', description: 'Kacamata minus frame hitam, ada kotak pelindung abu-abu', category: 'Aksesoris', sub: null, color: null, foundLocation: 'Musala', daysAgo: 6 },
  { name: 'Jam Tangan Strap Biru', description: 'Jam tangan digital dengan strap karet biru', category: 'Aksesoris', sub: null, color: 'Biru', foundLocation: 'Toilet Gedung A', daysAgo: 8 },
  { name: 'Tempat Pensil Merah', description: 'Tempat pensil kain merah berisi pulpen dan penghapus', category: 'Alat Tulis', sub: null, color: 'Merah', foundLocation: 'Ruang Kelas 301', daysAgo: 2 },
  { name: 'Pulpen dan Penggaris Kuning', description: 'Satu set pulpen dan penggaris besi dengan pegangan kuning', category: 'Alat Tulis', sub: null, color: 'Kuning', foundLocation: 'Lab Komputer', daysAgo: 9 },
  { name: 'Botol Minum Biru', description: 'Botol minum stainless biru 750 ml, ada stiker kecil di badan botol', category: 'Others', sub: null, color: 'Biru', foundLocation: 'Kantin', daysAgo: 3 },
  { name: 'Payung Kuning', description: 'Payung lipat kuning dengan gagang hitam', category: 'Others', sub: null, color: 'Kuning', foundLocation: 'Lobby', daysAgo: 12, taken: true },
];

async function seedSampleItems() {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  if ((await prisma.item.count()) > 0) {
    console.log('Data barang sudah ada, contoh barang dilewati');
    return;
  }

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const admin = email ? await prisma.admin.findUnique({ where: { email } }) : null;
  if (!admin) {
    console.warn('Admin belum ada, contoh barang dilewati');
    return;
  }

  const day = 24 * 60 * 60 * 1000;
  for (const [index, s] of sampleItems.entries()) {
    const category = await prisma.category.findUnique({ where: { name: s.category } });
    const subcategory = s.sub
      ? await prisma.subcategory.findUnique({
          where: { categoryId_name: { categoryId: category.id, name: s.sub } },
        })
      : null;
    const color = s.color ? await prisma.color.findUnique({ where: { name: s.color } }) : null;

    const item = await prisma.item.create({
      data: {
        code: `LNF-2026-${String(index + 1).padStart(4, '0')}`,
        name: s.name,
        description: s.description,
        categoryId: category.id,
        subcategoryId: subcategory ? subcategory.id : null,
        colorId: color ? color.id : null,
        photoUrl: `https://placehold.co/600x400?text=${encodeURIComponent(s.name)}`,
        foundLocation: s.foundLocation,
        foundAt: new Date(Date.now() - s.daysAgo * day),
        status: s.taken ? 'taken' : 'available',
        createdById: admin.id,
      },
    });

    if (s.taken) {
      await prisma.handover.create({
        data: {
          itemId: item.id,
          takerName: 'Budi Santoso',
          takerNim: '2203041001',
          ktmVerified: true,
          handedAt: new Date(Date.now() - day),
          handledById: admin.id,
        },
      });
    }
  }
  console.log(`${sampleItems.length} contoh barang dibuat`);
}

async function main() {
  await seedCatalogData();
  await seedAdmin();
  await seedSampleItems();
  console.log('Seed selesai');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
