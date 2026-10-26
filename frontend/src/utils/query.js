export function toQuery(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      if (value.length) sp.set(key, value.join(','));
    } else if (value !== undefined && value !== null && value !== '') {
      sp.set(key, String(value));
    }
  });
  const text = sp.toString();
  return text ? `?${text}` : '';
}
