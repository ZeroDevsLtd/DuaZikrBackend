import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { execute, queryOne } from '../db.js';
import { badRequest, fieldError, fromZod } from '../lib/errors.js';
import {
  hashPassword,
  issueToken,
  optionalUser,
  requireUser,
  serializeUser,
  verifyPassword,
} from '../lib/auth.js';

const password = z
  .string()
  .min(8, 'This password is too short. It must contain at least 8 characters.')
  .max(128)
  .refine((p) => !/^\d+$/.test(p), 'This password is entirely numeric.');

const optionalPhone = z.preprocess(
  (v) => (v === '' || v == null ? null : v),
  z.string().trim().max(20).nullable(),
);
const optionalAge = z.preprocess(
  (v) => (v === '' || v == null ? null : Number(v)),
  z.number().int().min(1).max(150).nullable(),
);
const optionalGender = z.preprocess(
  (v) => (v === '' || v == null ? null : String(v).trim().charAt(0).toUpperCase()),
  z.enum(['M', 'F']).nullable(),
);

const signupSchema = z
  .object({
    name: z.string().trim().min(1, 'This field is required.').max(255),
    email: z.email('Enter a valid email address.').trim().toLowerCase().max(254),
    password,
    password_confirm: z.string(),
    phone: optionalPhone.optional(),
    age: optionalAge.optional(),
    gender: optionalGender.optional(),
  })
  .refine((d) => d.password === d.password_confirm, { message: "Passwords don't match", path: [] });

const loginSchema = z.object({
  email: z.email('Enter a valid email address.').trim().toLowerCase(),
  password: z.string().min(1, 'This field is required.'),
});

const profileSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  phone: optionalPhone.optional(),
  age: optionalAge.optional(),
  gender: optionalGender.optional(),
});

const changePasswordSchema = z
  .object({ old_password: z.string(), new_password: password, new_password_confirm: z.string() })
  .refine((d) => d.new_password === d.new_password_confirm, { message: "Passwords don't match", path: [] });

const authRateLimit = { config: { rateLimit: { max: 10, timeWindow: '1 minute' } } };

function parse<T extends z.ZodTypeAny>(schema: T, body: unknown): z.infer<T> {
  const result = schema.safeParse(body ?? {});
  if (!result.success) throw fromZod(result.error);
  return result.data;
}

export async function deleteUserAccount(userId: number) {
  // Tokens, favorites cascade; devices are unlinked (ON DELETE SET NULL).
  await execute('DELETE FROM users WHERE id = ?', [userId]);
}

export async function authRoutes(app: FastifyInstance) {
  app.post('/signup', authRateLimit, async (request, reply) => {
    const data = parse(signupSchema, request.body);
    if (await queryOne('SELECT id FROM users WHERE email = ?', [data.email])) {
      throw fieldError('email', 'user with this email address already exists.');
    }
    const result = await execute(
      'INSERT INTO users (name, email, password_hash, phone, age, gender) VALUES (?, ?, ?, ?, ?, ?)',
      [data.name, data.email, await hashPassword(data.password), data.phone ?? null, data.age ?? null, data.gender ?? null],
    );
    const user = await queryOne('SELECT * FROM users WHERE id = ?', [result.insertId]);
    const token = await issueToken(result.insertId);
    return reply.code(201).send({ message: 'User registered successfully', user: serializeUser(user!), token });
  });

  app.post('/login', authRateLimit, async (request) => {
    const data = parse(loginSchema, request.body);
    const user = await queryOne('SELECT * FROM users WHERE email = ?', [data.email]);
    if (!user || !(await verifyPassword(data.password, user.password_hash))) {
      throw badRequest('Invalid email or password');
    }
    if (!user.is_active) throw badRequest('User account is disabled');
    const token = await issueToken(user.id);
    return { message: 'Login successful', user: serializeUser(user), token };
  });

  // Always succeeds, like v1; removes only the token used for this request.
  app.post('/logout', async (request) => {
    const ctx = await optionalUser(request);
    if (ctx) await execute('DELETE FROM auth_tokens WHERE token_hash = ?', [ctx.tokenHash]);
    return { message: 'Logout successful' };
  });

  app.get('/me', async (request) => {
    const { user } = await requireUser(request);
    return serializeUser(user);
  });

  app.get('/profile', async (request) => {
    const { user } = await requireUser(request);
    return serializeUser(user);
  });

  const updateProfile = async (request: any) => {
    const { user } = await requireUser(request);
    const data = parse(profileSchema, request.body);
    const fields = Object.entries(data).filter(([, v]) => v !== undefined);
    if (fields.length) {
      await execute(`UPDATE users SET ${fields.map(([k]) => `${k} = ?`).join(', ')} WHERE id = ?`, [
        ...fields.map(([, v]) => v),
        user.id,
      ]);
    }
    return serializeUser((await queryOne('SELECT * FROM users WHERE id = ?', [user.id]))!);
  };
  app.put('/profile', updateProfile);
  app.patch('/profile', updateProfile);

  app.post('/change-password', authRateLimit, async (request) => {
    const { user } = await requireUser(request);
    const data = parse(changePasswordSchema, request.body);
    if (!(await verifyPassword(data.old_password, user.password_hash))) {
      throw fieldError('old_password', 'Old password is incorrect');
    }
    await execute('UPDATE users SET password_hash = ? WHERE id = ?', [await hashPassword(data.new_password), user.id]);
    // Sign out every other session, then issue a fresh token.
    await execute('DELETE FROM auth_tokens WHERE user_id = ?', [user.id]);
    return { message: 'Password changed successfully', token: await issueToken(user.id) };
  });

  // Account deletion (Google Play requirement). Requires the password as confirmation.
  app.delete('/account', authRateLimit, async (request) => {
    const { user } = await requireUser(request);
    const { password: given } = parse(z.object({ password: z.string().min(1, 'This field is required.') }), request.body);
    if (!(await verifyPassword(given, user.password_hash))) throw fieldError('password', 'Password is incorrect');
    await deleteUserAccount(user.id);
    return { message: 'Account deleted' };
  });
}
