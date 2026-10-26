import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const COOKIE_NAME = 'lnf_token';

export function signToken(admin) {
  return jwt.sign({ sub: String(admin.id), role: 'admin' }, env.jwtSecret, {
    algorithm: 'HS256',
    expiresIn: env.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  return jwt.verify(token, env.jwtSecret, { algorithms: ['HS256'] });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.isProd,
    path: '/',
  };
}
