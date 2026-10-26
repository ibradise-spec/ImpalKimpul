const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, formData, signal } = {}) {
  const headers = body ? { 'Content-Type': 'application/json' } : undefined;
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    credentials: 'include',
    headers,
    body: formData ?? (body ? JSON.stringify(body) : undefined),
    signal,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/auth/')) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    throw new ApiError(res.status, data?.error || 'Terjadi kesalahan, coba lagi');
  }
  return data;
}
