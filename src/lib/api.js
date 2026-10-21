const configuredApiUrl = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, '');

export function apiUrl(path) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${configuredApiUrl || ''}${normalizedPath}`;
}
