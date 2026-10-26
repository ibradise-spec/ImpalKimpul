import { env } from '../config/env.js';
import { HttpError } from '../middleware/error.js';

export const itemInclude = {
  category: { select: { id: true, name: true } },
  subcategory: { select: { id: true, name: true } },
  color: { select: { id: true, name: true, hex: true } },
};

export const adminItemInclude = {
  ...itemInclude,
  createdBy: { select: { id: true, email: true, name: true } },
  handover: { select: { takerName: true, takerNim: true, ktmVerified: true, handedAt: true } },
};

export function resolvePhotoUrl(photoUrl) {
  if (photoUrl && photoUrl.startsWith('/')) {
    return `${env.publicUrl}${photoUrl}`;
  }
  return photoUrl;
}

export function toPublicItem(item) {
  return {
    id: item.id,
    code: item.code,
    name: item.name,
    description: item.description,
    category: item.category,
    subcategory: item.subcategory,
    color: item.color,
    photoUrl: resolvePhotoUrl(item.photoUrl),
    foundLocation: item.foundLocation,
    foundAt: item.foundAt,
    status: item.status,
  };
}

export function toAdminItem(item) {
  return {
    ...toPublicItem(item),
    aiConfidence: item.aiConfidence,
    createdBy: item.createdBy ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    handover: item.handover ?? null,
  };
}

export function parseCsv(value) {
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .filter((v) => typeof v === 'string')
    .flatMap((v) => v.split(','))
    .map((v) => v.trim())
    .filter(Boolean);
}

export function parsePagination(query, { defaultLimit = 12, maxLimit = 50 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

const SORT_FIELDS = { code: 'code', name: 'name', date: 'foundAt', status: 'status' };

export function parseSort(query) {
  const key = typeof query.sort === 'string' && Object.hasOwn(SORT_FIELDS, query.sort) ? query.sort : 'date';
  const direction = query.order === 'asc' ? 'asc' : 'desc';
  return [{ [SORT_FIELDS[key]]: direction }, { id: direction }];
}

function idOrNameFilter(values) {
  const ids = values.filter((v) => /^\d+$/.test(v)).map(Number);
  const names = values.filter((v) => !/^\d+$/.test(v));
  const conditions = [];
  if (ids.length) conditions.push({ id: { in: ids } });
  if (names.length) conditions.push({ name: { in: names } });
  return { is: { OR: conditions } };
}

export function buildItemWhere(query, { now = new Date(), defaultStatus = 'available', searchCode = false } = {}) {
  const where = { deletedAt: null };
  const and = [];

  const status = typeof query.status === 'string' ? query.status : defaultStatus;
  if (status !== 'all') {
    if (!['available', 'taken'].includes(status)) {
      throw new HttpError(400, 'status harus available, taken, atau all');
    }
    where.status = status;
  }

  if (query.period !== undefined) {
    if (query.period !== 'week') {
      throw new HttpError(400, 'period hanya mendukung nilai week');
    }
    where.foundAt = { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
  }

  const categories = parseCsv(query.category);
  if (categories.length) and.push({ category: idOrNameFilter(categories) });

  const subcategories = parseCsv(query.subcategory);
  if (subcategories.length) and.push({ subcategory: idOrNameFilter(subcategories) });

  const colors = parseCsv(query.color);
  if (colors.length) and.push({ color: idOrNameFilter(colors) });

  const search = typeof query.search === 'string' ? query.search.trim().slice(0, 100) : '';
  if (search) {
    const conditions = [
      { name: { contains: search } },
      { description: { contains: search } },
      { foundLocation: { contains: search } },
      { category: { is: { name: { contains: search } } } },
      { subcategory: { is: { name: { contains: search } } } },
      { color: { is: { name: { contains: search } } } },
    ];
    if (searchCode) conditions.push({ code: { contains: search } });
    and.push({ OR: conditions });
  }

  if (and.length) where.AND = and;
  return where;
}
