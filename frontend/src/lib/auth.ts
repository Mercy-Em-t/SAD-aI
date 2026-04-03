export interface AuthUser {
  id: string;
  email: string;
}

const TOKEN_KEY = 'sad_genius_token';
const USER_KEY = 'sad_genius_user';
// Development-only storage approach:
// localStorage is used for simplicity in this prototype.
// For production SaaS deployments, migrate auth token handling to secure httpOnly cookies.
const ALLOW_INSECURE_LOCALSTORAGE_AUTH = process.env.NEXT_PUBLIC_ALLOW_INSECURE_LOCALSTORAGE_AUTH === 'true';

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && !ALLOW_INSECURE_LOCALSTORAGE_AUTH) {
  throw new Error('SAD-GENIUS security enforcement: localStorage auth disabled in production. Use secure httpOnly cookie auth.');
}

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && ALLOW_INSECURE_LOCALSTORAGE_AUTH) {
  console.warn('SAD-GENIUS security warning: localStorage auth is enabled. Migrate to httpOnly cookies before production rollout.');
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthSession(token: string, user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}
