import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { parsePagination } from '../lib/catalog.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import adminItems from './adminItems.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/ping', (req, res) => {
  res.json({ ok: true, admin: req.admin.email });
});

router.get('/stats', async (_req, res) => {
  const [total, available, taken] = await Promise.all([
    prisma.item.count({ where: { deletedAt: null } }),
    prisma.item.count({ where: { deletedAt: null, status: 'available' } }),
    prisma.item.count({ where: { deletedAt: null, status: 'taken' } }),
  ]);
  res.json({ data: { total, available, taken } });
});

router.get('/audit-logs', async (req, res) => {
  const where = {};
  if (typeof req.query.entity === 'string' && req.query.entity) where.entity = req.query.entity;
  if (typeof req.query.action === 'string' && req.query.action) where.action = req.query.action;
  const entityId = Number(req.query.entityId);
  if (Number.isInteger(entityId) && entityId > 0) where.entityId = entityId;

  const { page, limit, skip } = parsePagination(req.query, { defaultLimit: 20, maxLimit: 100 });

  const [total, rows] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip,
      take: limit,
      include: { admin: { select: { id: true, email: true, name: true } } },
    }),
  ]);

  res.json({
    data: rows.map((row) => ({
      id: row.id,
      action: row.action,
      entity: row.entity,
      entityId: row.entityId,
      detail: row.detail,
      createdAt: row.createdAt,
      admin: row.admin,
    })),
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.use('/items', adminItems);

export default router;
