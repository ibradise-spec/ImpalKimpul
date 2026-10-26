import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

const router = Router();

router.get('/categories', async (_req, res) => {
  const data = await prisma.category.findMany({
    orderBy: { id: 'asc' },
    select: {
      id: true,
      name: true,
      subcategories: { orderBy: { id: 'asc' }, select: { id: true, name: true } },
    },
  });
  res.json({ data });
});

router.get('/colors', async (_req, res) => {
  const data = await prisma.color.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, name: true, hex: true },
  });
  res.json({ data });
});

router.get('/pos-locations', async (_req, res) => {
  const data = await prisma.posLocation.findMany({
    orderBy: { id: 'asc' },
    select: { id: true, name: true, description: true, mapUrl: true },
  });
  res.json({ data });
});

export default router;
