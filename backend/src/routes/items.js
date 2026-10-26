import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/error.js';
import { buildItemWhere, itemInclude, parsePagination, toPublicItem } from '../lib/catalog.js';

const router = Router();

router.get('/', async (req, res) => {
  const where = buildItemWhere(req.query);
  const { page, limit, skip } = parsePagination(req.query);

  const [total, rows] = await Promise.all([
    prisma.item.count({ where }),
    prisma.item.findMany({
      where,
      include: itemInclude,
      orderBy: [{ foundAt: 'desc' }, { id: 'desc' }],
      skip,
      take: limit,
    }),
  ]);

  res.json({
    data: rows.map(toPublicItem),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.get('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) {
    throw new HttpError(404, 'Barang tidak ditemukan');
  }

  const item = await prisma.item.findFirst({
    where: { id, deletedAt: null },
    include: itemInclude,
  });
  if (!item) {
    throw new HttpError(404, 'Barang tidak ditemukan');
  }

  const pickup = await prisma.posLocation.findFirst({ orderBy: { id: 'asc' } });

  res.json({
    data: {
      ...toPublicItem(item),
      pickupLocation: pickup
        ? { name: pickup.name, description: pickup.description, mapUrl: pickup.mapUrl }
        : null,
    },
  });
});

export default router;
