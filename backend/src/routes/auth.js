import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { prisma } from '../lib/prisma.js';
import { COOKIE_NAME, cookieOptions, signToken } from '../lib/token.js';
import { env } from '../config/env.js';
import { requireAuth } from '../middleware/auth.js';
import { HttpError } from '../middleware/error.js';

const router = Router();

const DUMMY_HASH = bcrypt.hashSync('password-pembanding', 10);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Terlalu banyak percobaan login, coba lagi dalam 15 menit' },
});

router.post('/login', loginLimiter, async (req, res) => {
  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body?.password === 'string' ? req.body.password : '';

  if (!email || !password) {
    throw new HttpError(400, 'Email dan password wajib diisi');
  }

  const admin = await prisma.admin.findUnique({ where: { email } });
  const hashToCheck = admin?.passwordHash || DUMMY_HASH;
  const passwordOk = await bcrypt.compare(password, hashToCheck);

  if (!admin || !admin.passwordHash || !admin.isActive || !passwordOk) {
    throw new HttpError(401, 'Email atau password salah');
  }

  await prisma.auditLog.create({
    data: { adminId: admin.id, action: 'login', entity: 'admin', entityId: admin.id },
  });

  res.cookie(COOKIE_NAME, signToken(admin), { ...cookieOptions(), maxAge: env.cookieMaxAgeMs });
  res.json({ admin: { id: admin.id, email: admin.email, name: admin.name } });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ admin: req.admin });
});

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, cookieOptions());
  res.json({ message: 'Berhasil logout' });
});

export default router;
