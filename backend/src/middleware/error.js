export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function notFound(req, _res, next) {
  next(new HttpError(404, `Route ${req.method} ${req.originalUrl} tidak ditemukan`));
}

export function errorHandler(err, _req, res, _next) {
  const status = err.status || 500;
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    error: status >= 500 ? 'Terjadi kesalahan pada server' : err.message,
  });
}
