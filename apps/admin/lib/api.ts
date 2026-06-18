const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export const getToken = (): string | null =>
  typeof window !== 'undefined' ? localStorage.getItem('rc_admin_token') : null;

export async function api<T = unknown>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { message?: string }).message || `Request failed (${res.status})`);
  }
  return (res.status === 204 ? null : await res.json()) as T;
}

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(BASE + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error('Login failed — check credentials');
  const data = (await res.json()) as { tokens: { accessToken: string } };
  localStorage.setItem('rc_admin_token', data.tokens.accessToken);
}

export const logout = (): void => localStorage.removeItem('rc_admin_token');
