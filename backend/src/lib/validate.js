import { HttpError } from '../middleware/error.js';

export function requiredString(value, field, max) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new HttpError(400, `${field} wajib diisi`);
  }
  const text = value.trim();
  if (text.length > max) {
    throw new HttpError(400, `${field} maksimal ${max} karakter`);
  }
  return text;
}

export function optionalString(value, field, max) {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  if (typeof value !== 'string') {
    throw new HttpError(400, `${field} tidak valid`);
  }
  const text = value.trim();
  if (!text) return null;
  if (text.length > max) {
    throw new HttpError(400, `${field} maksimal ${max} karakter`);
  }
  return text;
}

export function requiredId(value, field) {
  const usable = typeof value === 'number' || (typeof value === 'string' && value.trim() !== '');
  const n = usable ? Number(value) : NaN;
  if (!Number.isInteger(n) || n < 1) {
    throw new HttpError(400, `${field} tidak valid`);
  }
  return n;
}

export function optionalId(value, field) {
  if (value === undefined) return undefined;
  if (value === null || value === '' || value === 'null') return null;
  return requiredId(value, field);
}

export function optionalDate(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  const date = new Date(value);
  if (typeof value !== 'string' || Number.isNaN(date.getTime())) {
    throw new HttpError(400, `${field} bukan tanggal yang valid`);
  }
  if (date.getTime() > Date.now() + 5 * 60 * 1000) {
    throw new HttpError(400, `${field} tidak boleh di masa depan`);
  }
  return date;
}

export function optionalConfidence(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const usable = typeof value === 'number' || typeof value === 'string';
  const n = usable ? Number(value) : NaN;
  if (!Number.isFinite(n) || n < 0 || n > 1) {
    throw new HttpError(400, 'aiConfidence harus berupa angka antara 0 dan 1');
  }
  return n;
}

export function isTrue(value) {
  return value === true || value === 'true' || value === '1' || value === 1;
}
