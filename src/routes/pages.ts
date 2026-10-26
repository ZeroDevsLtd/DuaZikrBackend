import formbody from '@fastify/formbody';
import type { FastifyInstance } from 'fastify';
import { queryOne } from '../db.js';
import { verifyPassword } from '../lib/auth.js';
import { deleteUserAccount } from './auth.js';

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function page(body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Delete account · Dua &amp; Zikr</title>
<style>
  :root { color-scheme: light dark; --bg:#f6f7f5; --card:#fff; --text:#1d2420; --muted:#5f6b64; --accent:#2c5530; --danger:#b42318; --border:#dfe3df; }
  @media (prefers-color-scheme: dark) { :root { --bg:#111513; --card:#1a201c; --text:#e7ece8; --muted:#9aa69f; --accent:#7fbf86; --danger:#f97066; --border:#2c342f; } }
  body { margin:0; font:16px/1.5 system-ui, sans-serif; background:var(--bg); color:var(--text); }
  main { max-width:440px; margin:48px auto; padding:0 16px; }
  .card { background:var(--card); border:1px solid var(--border); border-radius:12px; padding:24px; }
  h1 { font-size:22px; margin:0 0 8px; } p { color:var(--muted); margin:0 0 16px; }
  label { display:block; font-weight:600; margin:12px 0 4px; }
  input { width:100%; box-sizing:border-box; padding:10px 12px; border:1px solid var(--border); border-radius:8px; background:transparent; color:var(--text); font:inherit; }
  button { margin-top:20px; width:100%; padding:12px; border:0; border-radius:8px; background:var(--danger); color:#fff; font:600 16px system-ui; cursor:pointer; }
  .msg { padding:12px; border-radius:8px; margin-bottom:12px; border:1px solid var(--border); }
  .ok { color:var(--accent); } .err { color:var(--danger); }
</style></head><body><main><div class="card">${body}</div></main></body></html>`;
}

const form = (message = '') => `
  <h1>Delete your account</h1>
  <p>This permanently deletes your Dua &amp; Zikr account, your synced favorites and your sessions.
  Data saved only on your phone is not affected. This cannot be undone.</p>
  ${message}
  <form method="post" action="/delete-account">
    <label for="email">Email</label>
    <input id="email" name="email" type="email" autocomplete="email" required>
    <label for="password">Password</label>
    <input id="password" name="password" type="password" autocomplete="current-password" required>
    <button type="submit">Delete my account</button>
  </form>`;

export async function pageRoutes(app: FastifyInstance) {
  await app.register(formbody);

  app.get('/', async (_request, reply) => reply.redirect('/admin/'));

  app.get('/delete-account', async (_request, reply) => reply.type('text/html').send(page(form())));

  app.post<{ Body: { email?: string; password?: string } }>(
    '/delete-account',
    { config: { rateLimit: { max: 5, timeWindow: '1 minute' } } },
    async (request, reply) => {
      const email = String(request.body?.email ?? '').trim().toLowerCase();
      const password = String(request.body?.password ?? '');
      const user = email ? await queryOne('SELECT id, password_hash FROM users WHERE email = ?', [email]) : null;
      if (!user || !(await verifyPassword(password, user.password_hash))) {
        const msg = `<div class="msg err">Email or password is incorrect.</div>`;
        return reply.code(400).type('text/html').send(page(form(msg)));
      }
      await deleteUserAccount(user.id);
      request.log.info({ userId: user.id }, 'account deleted via web page');
      return reply
        .type('text/html')
        .send(page(`<h1>Account deleted</h1><p class="ok">The account for ${escapeHtml(email)} and its data have been deleted.</p>`));
    },
  );
}
