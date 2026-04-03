import crypto from 'crypto';
import { query } from '../db/client';

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
  async register(email: string, password: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await query<{ id: string }>('SELECT id FROM users WHERE email = $1 LIMIT 1', [normalizedEmail]);
    if (existing.rowCount && existing.rowCount > 0) throw new Error('Email already registered');

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

    await query(
      'INSERT INTO users (id, email, password_hash, salt, created_at) VALUES ($1, $2, $3, $4, $5)',
      [user.id, user.email, user.passwordHash, user.salt, user.createdAt]
    );
    return user;
  }

  async login(email: string, password: string): Promise<User | null> {
    const normalizedEmail = email.trim().toLowerCase();
    const found = await query<{
      id: string;
      email: string;
      password_hash: string;
      salt: string;
      created_at: string;
    }>(
      'SELECT id, email, password_hash, salt, created_at FROM users WHERE email = $1 LIMIT 1',
      [normalizedEmail]
    );
    if (!found.rowCount || found.rowCount === 0) return null;
    const row = found.rows[0];
    const user: User = {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      salt: row.salt,
      createdAt: new Date(row.created_at).toISOString(),
    };

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

  async issueToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(48).toString('hex');
    const session: Session = {
      token,
      userId,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    await query(
      'INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, to_timestamp($3 / 1000.0))',
      [session.token, session.userId, session.expiresAt]
    );
    return token;
  }

  async getUserByToken(token: string): Promise<User | null> {
    const result = await query<{
      id: string;
      email: string;
      password_hash: string;
      salt: string;
      created_at: string;
      expires_at: string;
    }>(
      `SELECT u.id, u.email, u.password_hash, u.salt, u.created_at, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = $1
       LIMIT 1`,
      [token]
    );
    if (!result.rowCount || result.rowCount === 0) return null;
    const row = result.rows[0];
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await this.revokeToken(token);
      return null;
    }
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      salt: row.salt,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }

  async revokeToken(token: string): Promise<void> {
    await query('DELETE FROM sessions WHERE token = $1', [token]);
  }

  private hashPassword(password: string, salt: string): string {
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  }
}

export const authStore = new AuthStore();
