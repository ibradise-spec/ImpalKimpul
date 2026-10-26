import { prisma } from '../lib/prisma.js';
import { COOKIE_NAME, verifyToken } from '../lib/token.js';
import { HttpError } from './error.js';

function extractToken(req) {
  if (req.cookies?.[COOKIE_NAME]) {
    return req.cookies[COOKIE_NAME];
  }
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    return header.slice(7);
  }
  return null;
}

export async function requireAuth(req, _res, next) {
  const token = extractToken(req);
  if (!token) {
    throw new HttpError(401, 'Silakan login terlebih dahulu');
  }

  let payload;
  try {
    payload = verifyToken(token);
  } catch {
    throw new HttpError(401, 'Sesi tidak valid atau sudah berakhir');
  }

  const admin = await prisma.admin.findUnique({ where: { id: Number(payload.sub) } });
  if (!admin || !admin.isActive) {
    throw new HttpError(401, 'Akun tidak ditemukan atau nonaktif');
  }

  req.admin = { id: admin.id, email: admin.email, name: admin.name, role: 'admin' };
  next();
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.admin) {
      throw new HttpError(401, 'Silakan login terlebih dahulu');
    }
    if (!roles.includes(req.admin.role)) {
      throw new HttpError(403, 'Anda tidak punya akses ke resource ini');
    }
    next();
  };
}
