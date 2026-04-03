import crypto from 'crypto';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
}

interface Session {
  token: string;
  userId: string;
  expiresAt: number;
}

const DEFAULT_SESSION_DURATION_HOURS = 2;
const DEFAULT_SESSION_DURATION_MS = DEFAULT_SESSION_DURATION_HOURS * 60 * 60 * 1000;
const MAX_SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;
const configuredSessionDurationMs = Number(process.env.AUTH_SESSION_DURATION_MS);
const isConfiguredSessionDurationValid = Number.isFinite(configuredSessionDurationMs) && configuredSessionDurationMs > 0;
const SESSION_DURATION_MS = isConfiguredSessionDurationValid
  ? Math.min(configuredSessionDurationMs, MAX_SESSION_DURATION_MS)
  : DEFAULT_SESSION_DURATION_MS;

if (process.env.AUTH_SESSION_DURATION_MS && !isConfiguredSessionDurationValid) {
  console.warn('Invalid AUTH_SESSION_DURATION_MS. Falling back to default 2-hour session duration.');
}
if (isConfiguredSessionDurationValid && configuredSessionDurationMs > MAX_SESSION_DURATION_MS) {
  console.warn('AUTH_SESSION_DURATION_MS exceeds max allowed value. Capping to 30 days.');
}

class AuthStore {
  private usersById: Map<string, User> = new Map();
  private userIdByEmail: Map<string, string> = new Map();
  private sessionsByToken: Map<string, Session> = new Map();

  register(email: string, password: string): User {
    const normalizedEmail = email.trim().toLowerCase();
    if (this.userIdByEmail.has(normalizedEmail)) {
      throw new Error('Email already registered');
    }

    const id = crypto.randomUUID();
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = this.hashPassword(password, salt);
    const user: User = {
      id,
      email: normalizedEmail,
      passwordHash,
      salt,
      createdAt: new Date().toISOString(),
    };

    this.usersById.set(id, user);
    this.userIdByEmail.set(normalizedEmail, id);
    return user;
  }

  login(email: string, password: string): User | null {
    const normalizedEmail = email.trim().toLowerCase();
    const userId = this.userIdByEmail.get(normalizedEmail);
    if (!userId) return null;

    const user = this.usersById.get(userId);
    if (!user) return null;

    const providedHash = this.hashPassword(password, user.salt);
    const providedHashBuffer = Buffer.from(providedHash);
    const storedHashBuffer = Buffer.from(user.passwordHash);
    const sameLength = providedHashBuffer.length === storedHashBuffer.length;
    const safeProvidedHashBuffer = sameLength ? providedHashBuffer : crypto.randomBytes(storedHashBuffer.length);
    if (!crypto.timingSafeEqual(safeProvidedHashBuffer, storedHashBuffer) || !sameLength) {
      return null;
    }

    return user;
  }

  issueToken(userId: string): string {
    const token = crypto.randomBytes(48).toString('hex');
    this.sessionsByToken.set(token, {
      token,
      userId,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    });
    return token;
  }

  getUserByToken(token: string): User | null {
    const session = this.sessionsByToken.get(token);
    if (!session) return null;
    if (session.expiresAt < Date.now()) {
      this.sessionsByToken.delete(token);
      return null;
    }
    return this.usersById.get(session.userId) || null;
  }

  revokeToken(token: string): void {
    this.sessionsByToken.delete(token);
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  }
}

export const authStore = new AuthStore();
