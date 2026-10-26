import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/error.js';
import {
  adminItemInclude,
  buildItemWhere,
  parsePagination,
  parseSort,
  toAdminItem,
} from '../lib/catalog.js';
import {
  photoPathFor,
  removeStoredPhoto,
  removeUploadedFile,
  uploadPhoto,
  verifyImageFile,
} from '../lib/storage.js';
import {
  isTrue,
  optionalConfidence,
  optionalDate,
  optionalId,
  optionalString,
  requiredId,
  requiredString,
} from '../lib/validate.js';
import { logAction } from '../lib/audit.js';
import { analyzeImage } from '../lib/ai.js';
import { AiError, buildDraft, emptyDraft } from '../lib/aiMapping.js';

const router = Router();

function parseItemId(raw) {
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(404, 'Barang tidak ditemukan');
  }
  return id;
}

async function findActiveItem(id) {
  const item = await prisma.item.findFirst({
    where: { id, deletedAt: null },
    include: adminItemInclude,
  });
  if (!item) {
    throw new HttpError(404, 'Barang tidak ditemukan');
  }
  return item;
}

async function assertReferences({ categoryId, subcategoryId, colorId }) {
  if (categoryId != null) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) throw new HttpError(400, 'Kategori tidak ditemukan');
  }
  if (subcategoryId != null) {
    const sub = await prisma.subcategory.findUnique({ where: { id: subcategoryId } });
    if (!sub) throw new HttpError(400, 'Subkategori tidak ditemukan');
    if (categoryId != null && sub.categoryId !== categoryId) {
      throw new HttpError(400, 'Subkategori bukan bagian dari kategori yang dipilih');
    }
  }
  if (colorId != null) {
    const color = await prisma.color.findUnique({ where: { id: colorId } });
    if (!color) throw new HttpError(400, 'Warna tidak ditemukan');
  }
}

async function createItemWithCode(data, adminId) {
  const prefix = `LNF-${new Date().getFullYear()}-`;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.$transaction(async (tx) => {
        const last = await tx.item.findFirst({
          where: { code: { startsWith: prefix } },
          orderBy: { code: 'desc' },
          select: { code: true },
        });
        const next = last ? Number(last.code.slice(prefix.length)) + 1 : 1;
        const code = `${prefix}${String(next).padStart(4, '0')}`;
        const item = await tx.item.create({ data: { ...data, code }, include: adminItemInclude });
        await logAction(tx, adminId, 'create', 'item', item.id, { code, name: item.name });
        return item;
      });
    } catch (err) {
      if (err.code === 'P2002' && attempt < 4) continue;
      throw err;
    }
  }
  throw new HttpError(500, 'Gagal membuat kode barang');
}

router.get('/', async (req, res) => {
  const where = buildItemWhere(req.query, { defaultStatus: 'all', searchCode: true });
  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [total, rows] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.findMany({
      where,
      include: adminItemInclude,
      orderBy: parseSort(req.query),
      skip,
      take: limit,
    }),
  ]);

  res.json({
    data: rows.map(toAdminItem),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.post('/analyze', uploadPhoto, async (req, res) => {
  const file = req.file;
  try {
    if (!file) {
      throw new HttpError(400, 'Foto wajib diunggah di field "photo"');
    }
    await verifyImageFile(file);

    const [categories, colors] = await Promise.all([
      prisma.category.findMany({ include: { subcategories: true } }),
      prisma.color.findMany(),
    ]);

    let draft;
    try {
      const result = await analyzeImage(file);
      draft = buildDraft(result, { categories, colors });
    } catch (err) {
      const reason = err instanceof AiError ? err.reason : 'unavailable';
      console.warn(`AI analyze gagal (${reason}): ${err.message}`);
      draft = emptyDraft(reason);
    }

    res.json({ data: draft });
  } finally {
    if (file) await removeUploadedFile(file.path);
  }
});

router.get('/:id', async (req, res) => {
  const item = await findActiveItem(parseItemId(req.params.id));
  res.json({ data: toAdminItem(item) });
});

router.post('/', uploadPhoto, async (req, res) => {
  const file = req.file;
  try {
    if (!file) {
      throw new HttpError(400, 'Foto barang wajib diunggah di field "photo"');
    }
    await verifyImageFile(file);

    const body = req.body ?? {};
    const data = {
      name: requiredString(body.name, 'Nama barang', 200),
      description: optionalString(body.description, 'Deskripsi', 5000) ?? null,
      foundLocation: requiredString(body.foundLocation, 'Lokasi penemuan', 200),
      categoryId: requiredId(body.categoryId, 'Kategori'),
      subcategoryId: optionalId(body.subcategoryId, 'Subkategori') ?? null,
      colorId: optionalId(body.colorId, 'Warna') ?? null,
      foundAt: optionalDate(body.foundAt, 'Tanggal') ?? new Date(),
      aiConfidence: optionalConfidence(body.aiConfidence) ?? null,
    };
    await assertReferences(data);

    const item = await createItemWithCode(
      { ...data, photoUrl: photoPathFor(file), createdById: req.admin.id },
      req.admin.id,
    );
    res.status(201).json({ data: toAdminItem(item) });
  } catch (err) {
    if (file) await removeUploadedFile(file.path);
    throw err;
  }
});

router.patch('/:id', uploadPhoto, async (req, res) => {
  const file = req.file;
  let committed = false;
  try {
    const id = parseItemId(req.params.id);
    const existing = await findActiveItem(id);
    if (file) await verifyImageFile(file);

    const body = req.body ?? {};
    const update = {};
    const changes = {};

    const apply = (field, value) => {
      if (value === undefined) return;
      const before = existing[field];
      const same =
        before instanceof Date && value instanceof Date
          ? before.getTime() === value.getTime()
          : before === value;
      if (same) return;
      update[field] = value;
      changes[field] = {
        from: before instanceof Date ? before.toISOString() : before,
        to: value instanceof Date ? value.toISOString() : value,
      };
    };

    apply('name', body.name !== undefined ? requiredString(body.name, 'Nama barang', 200) : undefined);
    apply('description', optionalString(body.description, 'Deskripsi', 5000));
    apply(
      'foundLocation',
      body.foundLocation !== undefined ? requiredString(body.foundLocation, 'Lokasi penemuan', 200) : undefined,
    );
    apply('categoryId', body.categoryId !== undefined ? requiredId(body.categoryId, 'Kategori') : undefined);
    apply('subcategoryId', optionalId(body.subcategoryId, 'Subkategori'));
    apply('colorId', optionalId(body.colorId, 'Warna'));
    apply('foundAt', optionalDate(body.foundAt, 'Tanggal'));

    const finalCategoryId = update.categoryId ?? existing.categoryId;

    if (update.categoryId !== undefined && update.subcategoryId === undefined && existing.subcategoryId) {
      const currentSub = await prisma.subcategory.findUnique({ where: { id: existing.subcategoryId } });
      if (currentSub && currentSub.categoryId !== finalCategoryId) {
        update.subcategoryId = null;
        changes.subcategoryId = { from: existing.subcategoryId, to: null };
      }
    }

    await assertReferences({
      categoryId: finalCategoryId,
      subcategoryId: update.subcategoryId,
      colorId: update.colorId,
    });

    if (file) {
      update.photoUrl = photoPathFor(file);
      changes.photo = 'diganti';
    }

    if (Object.keys(update).length === 0) {
      res.json({ data: toAdminItem(existing) });
      return;
    }

    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.item.update({ where: { id }, data: update, include: adminItemInclude });
      await logAction(tx, req.admin.id, 'update', 'item', id, { code: existing.code, changes });
      return updated;
    });
    committed = true;

    if (file) await removeStoredPhoto(existing.photoUrl);
    res.json({ data: toAdminItem(item) });
  } catch (err) {
    if (file && !committed) await removeUploadedFile(file.path);
    throw err;
  }
});

router.delete('/:id', async (req, res) => {
  const id = parseItemId(req.params.id);
  const existing = await findActiveItem(id);

  await prisma.$transaction(async (tx) => {
    await tx.item.update({ where: { id }, data: { deletedAt: new Date() } });
    await logAction(tx, req.admin.id, 'delete', 'item', id, { code: existing.code, name: existing.name });
  });

  res.json({ message: 'Barang berhasil dihapus' });
});

router.post('/:id/handover', async (req, res) => {
  const id = parseItemId(req.params.id);
  const body = req.body ?? {};
  const takerName = requiredString(body.takerName, 'Nama pengambil', 150);
  const takerNim = requiredString(body.takerNim, 'NIM pengambil', 30);
  if (!isTrue(body.ktmVerified)) {
    throw new HttpError(400, 'KTM pengambil harus diverifikasi terlebih dahulu');
  }

  try {
    const item = await prisma.$transaction(async (tx) => {
      const existing = await tx.item.findFirst({ where: { id, deletedAt: null } });
      if (!existing) throw new HttpError(404, 'Barang tidak ditemukan');
      if (existing.status === 'taken') throw new HttpError(409, 'Barang ini sudah diambil');

      await tx.handover.create({
        data: { itemId: id, takerName, takerNim, ktmVerified: true, handledById: req.admin.id },
      });
      await tx.item.update({ where: { id }, data: { status: 'taken' } });
      await logAction(tx, req.admin.id, 'handover', 'item', id, {
        code: existing.code,
        takerName,
        takerNim,
      });
      return tx.item.findUnique({ where: { id }, include: adminItemInclude });
    });
    res.status(201).json({ data: toAdminItem(item) });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new HttpError(409, 'Barang ini sudah diambil');
    }
    throw err;
  }
});

router.delete('/:id/handover', async (req, res) => {
  const id = parseItemId(req.params.id);

  const item = await prisma.$transaction(async (tx) => {
    const existing = await tx.item.findFirst({
      where: { id, deletedAt: null },
      include: { handover: true },
    });
    if (!existing) throw new HttpError(404, 'Barang tidak ditemukan');
    if (existing.status !== 'taken') throw new HttpError(409, 'Barang ini belum ditandai sudah diambil');

    await tx.handover.deleteMany({ where: { itemId: id } });
    await tx.item.update({ where: { id }, data: { status: 'available' } });
    await logAction(tx, req.admin.id, 'handover_revert', 'item', id, {
      code: existing.code,
      takerName: existing.handover?.takerName,
      takerNim: existing.handover?.takerNim,
    });
    return tx.item.findUnique({ where: { id }, include: adminItemInclude });
  });

  res.json({ data: toAdminItem(item) });
});

export default router;
