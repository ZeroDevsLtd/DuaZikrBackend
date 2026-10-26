import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { FastifyRequest } from 'fastify';
import { execute, queryOne, type Row } from '../db.js';
import { unauthorized } from './errors.js';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Creates a new API token for the user and returns the raw value (only shown once). */
export async function issueToken(userId: number): Promise<string> {
  const token = randomBytes(20).toString('hex'); // 40 hex chars, same length as v1 tokens
  await execute('INSERT INTO auth_tokens (user_id, token_hash) VALUES (?, ?)', [userId, hashToken(token)]);
  return token;
}

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/** Reads `Authorization: Token <key>` (v1 format); `Bearer <key>` is accepted too. */
export function readToken(request: FastifyRequest): string | null {
  const header = request.headers.authorization;
  if (!header) return null;
  const match = /^(Token|Bearer)\s+(\S+)$/i.exec(header.trim());
  return match ? match[2] : null;
}

export interface AuthContext {
  user: Row;
  tokenHash: string;
}

/** Returns the user for the request's token, or null when there is no valid token. */
export async function optionalUser(request: FastifyRequest): Promise<AuthContext | null> {
  const token = readToken(request);
  if (!token) return null;
  const tokenHash = hashToken(token);
  const user = await queryOne(
    `SELECT u.* FROM auth_tokens t JOIN users u ON u.id = t.user_id
     WHERE t.token_hash = ? AND u.is_active = 1`,
    [tokenHash],
  );
  if (!user) return null;
  await execute('UPDATE auth_tokens SET last_used_at = CURRENT_TIMESTAMP(3) WHERE token_hash = ?', [tokenHash]);
  return { user, tokenHash };
}

export async function requireUser(request: FastifyRequest): Promise<AuthContext> {
  if (!readToken(request)) throw unauthorized();
  const ctx = await optionalUser(request);
  if (!ctx) throw unauthorized('Invalid token.');
  return ctx;
}

/** v1 user shape returned by signup, login and profile. */
export function serializeUser(user: Row) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    age: user.age,
    gender: user.gender,
    email_verified: Boolean(user.email_verified),
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}
