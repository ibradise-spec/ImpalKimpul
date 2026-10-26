import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/error.js';

export const uploadRoot = path.resolve(env.uploadDir);
const itemsDir = path.join(uploadRoot, 'items');
const PUBLIC_PREFIX = '/uploads/items/';
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

fs.mkdirSync(itemsDir, { recursive: true });

const EXT_BY_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, itemsDir),
  filename: (_req, file, cb) => cb(null, `${crypto.randomUUID()}${EXT_BY_MIME[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_PHOTO_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!EXT_BY_MIME[file.mimetype]) {
      cb(new HttpError(400, 'Format foto harus JPG, PNG, atau WEBP'));
      return;
    }
    cb(null, true);
  },
});

export function uploadPhoto(req, res, next) {
  upload.single('photo')(req, res, (err) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        next(new HttpError(413, 'Ukuran foto maksimal 5 MB'));
        return;
      }
      next(new HttpError(400, 'Upload tidak valid, kirim satu file di field "photo"'));
      return;
    }
    next(err);
  });
}

export function photoPathFor(file) {
  return `${PUBLIC_PREFIX}${file.filename}`;
}

export async function removeUploadedFile(filePath) {
  try {
    await fsp.unlink(filePath);
  } catch {
    /* file sudah tidak ada */
  }
}

export async function removeStoredPhoto(photoUrl) {
  if (!photoUrl || !photoUrl.startsWith(PUBLIC_PREFIX)) return;
  await removeUploadedFile(path.join(itemsDir, path.basename(photoUrl)));
}

async function readHead(filePath) {
  const handle = await fsp.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(12);
    await handle.read(buf, 0, 12, 0);
    return buf;
  } finally {
    await handle.close();
  }
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export async function verifyImageFile(file) {
  const head = await readHead(file.path);
  const isJpeg = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  const isPng = head.subarray(0, 8).equals(PNG_SIGNATURE);
  const isWebp =
    head.subarray(0, 4).toString('ascii') === 'RIFF' &&
    head.subarray(8, 12).toString('ascii') === 'WEBP';

  const valid =
    (file.mimetype === 'image/jpeg' && isJpeg) ||
    (file.mimetype === 'image/png' && isPng) ||
    (file.mimetype === 'image/webp' && isWebp);

  if (!valid) {
    await removeUploadedFile(file.path);
    throw new HttpError(400, 'Isi file bukan gambar yang valid');
  }
}
