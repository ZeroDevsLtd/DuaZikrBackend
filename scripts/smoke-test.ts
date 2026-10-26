/**
 * End-to-end check of every public endpoint against a running server, including the
 * response shapes the mobile app relies on. Creates and then deletes a throwaway user.
 *
 * Usage: npm run smoke [-- http://localhost:8000]
 */
const BASE = (process.argv[2] ?? 'http://localhost:8000').replace(/\/$/, '');
let failures = 0;

function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `  -> ${detail}` : ''}`);
  if (!ok) failures++;
}

async function call(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Token ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json };
}

const LANGS = ['en', 'bn', 'ar', 'ur', 'de', 'es', 'id'];
const hasLangs = (o: any) => o && LANGS.every((l) => typeof o[l] === 'string');

async function main() {
  // --- content ---
  const root = await call('GET', '/api/');
  check('GET /api/ reachable', root.status === 200 && root.json?.api_name === 'Dua & Zikr API');

  const all = await call('GET', '/api/getalldua/');
  const dua = all.json?.duas?.[0];
  check('GET /api/getalldua/ shape', all.status === 200 && Array.isArray(all.json?.duas) && all.json.duas.length > 0);
  check('metadata.categories', Array.isArray(all.json?.metadata?.categories) && all.json.metadata.categories.length > 0);
  check(
    'dua fields (v1 shape)',
    dua &&
      typeof dua.id === 'string' &&
      typeof dua.dua_text === 'string' &&
      hasLangs(dua.title) &&
      hasLangs(dua.translation) &&
      hasLangs(dua.transliteration) &&
      hasLangs(dua.benefits) &&
      'category_id' in dua &&
      typeof dua.audio === 'object' &&
      typeof dua.usage === 'object' &&
      Array.isArray(dua.tags),
    JSON.stringify(dua)?.slice(0, 200),
  );
  const cat = all.json?.metadata?.categories?.[0];
  check('category fields (v1 shape)', cat && typeof cat.id === 'number' && hasLangs(cat.name) && typeof cat.slug === 'string');
  check('types present for Home screen', ['quranic', 'hadith'].every((t) => all.json?.duas?.some((d: any) => d.type === t)));

  check('GET /api/getallcategory/', (await call('GET', '/api/getallcategory/')).json?.categories?.length > 0);
  const one = await call('GET', `/api/dua/${dua.id}/`);
  check('GET /api/dua/{id}/', one.status === 200 && one.json?.id === dua.id);
  check('GET /api/dua/{missing}/ -> 404', (await call('GET', '/api/dua/does-not-exist/')).status === 404);
  const bySlug = await call('GET', `/api/category/${cat.slug}/`);
  check('GET /api/category/{slug}/', bySlug.status === 200 && Array.isArray(bySlug.json?.duas));
  check('GET /api/search/?q=Allah', (await call('GET', '/api/search/?q=Allah')).json?.count > 0);
  check('GET /api/search/ without q -> 400', (await call('GET', '/api/search/')).status === 400);
  check('GET /api/popular/?limit=3', (await call('GET', '/api/popular/?limit=3')).json?.duas?.length <= 3);
  check('GET /api/type/quranic/', (await call('GET', '/api/type/quranic/')).json?.count > 0);
  check('GET /api/difficulty/beginner/', (await call('GET', '/api/difficulty/beginner/')).status === 200);
  check('POST /api/favorite/{id}/', typeof (await call('POST', `/api/favorite/${dua.id}/`)).json?.favoriteCount === 'number');
  check('GET /api/info/', (await call('GET', '/api/info/')).json?.statistics?.totalDuas > 0);

  const ads = await call('GET', '/api/getallads');
  const ad = ads.json?.data?.ads?.[0];
  check('GET /api/getallads (no slash) shape', ads.json?.success === true && Array.isArray(ads.json?.data?.ads));
  check(
    'ad fields match app validator',
    ad &&
      ['id', 'title', 'text', 'actionText', 'actionColor', 'textColor', 'titleColor', 'link', 'iconName', 'iconColor'].every(
        (k) => typeof ad[k] === 'string',
      ) &&
      ad.isActive === true &&
      typeof ad.priority === 'number',
  );

  // --- auth ---
  const email = `smoke_${Date.now()}@example.com`;
  const password = 'smoke-test-pass-1';
  const bad = await call('POST', '/api/auth/signup/', { name: 'X', email: 'nope', password: '1', password_confirm: '2' });
  check('signup validation -> field errors', bad.status === 400 && Array.isArray(bad.json?.email) && typeof bad.json?.message === 'string');

  const signup = await call('POST', '/api/auth/signup/', {
    name: 'Smoke Test',
    email,
    password,
    password_confirm: password,
    age: 30,
    gender: 'M',
  });
  check('POST /api/auth/signup/ -> 201 + token', signup.status === 201 && typeof signup.json?.token === 'string');
  check('signup user shape', signup.json?.user?.email === email && 'created_at' in (signup.json?.user ?? {}));
  const dupe = await call('POST', '/api/auth/signup/', { name: 'X', email, password, password_confirm: password });
  check('duplicate email -> email error', dupe.status === 400 && Array.isArray(dupe.json?.email));

  const wrong = await call('POST', '/api/auth/login/', { email, password: 'wrong-password' });
  check('login wrong password -> 400 + message', wrong.status === 400 && typeof wrong.json?.message === 'string');
  const login = await call('POST', '/api/auth/login/', { email, password });
  const token: string = login.json?.token;
  check('POST /api/auth/login/', login.status === 200 && typeof token === 'string');

  check('GET /api/auth/profile/', (await call('GET', '/api/auth/profile/', undefined, token)).json?.email === email);
  check('GET /api/auth/me/', (await call('GET', '/api/auth/me/', undefined, token)).json?.email === email);
  check('profile without token -> 401', (await call('GET', '/api/auth/profile/')).status === 401);
  check('profile bad token -> 401', (await call('GET', '/api/auth/profile/', undefined, 'bad')).status === 401);
  const patched = await call('PATCH', '/api/auth/profile/', { name: 'Smoke Renamed', age: 31 }, token);
  check('PATCH /api/auth/profile/', patched.json?.name === 'Smoke Renamed' && patched.json?.age === 31);

  // --- device + favorites ---
  const device = await call('POST', '/api/device/register/', {
    device_token: `smoke-device-${Date.now()}`,
    platform: 'android',
    app_version: '1.0.0',
    package: 'com.zerodevs.duazikr',
    locale: 'bn-BD',
  });
  check('POST /api/device/register/ (guest)', device.status === 201);

  check('GET /api/favorites/ empty', (await call('GET', '/api/favorites/', undefined, token)).json?.count === 0);
  const put = await call('PUT', '/api/favorites/', { dua_ids: [dua.id, 'q1', 'q1'] }, token);
  check('PUT /api/favorites/ dedupes', put.json?.count === 2);
  check('POST /api/favorites/{id}/', (await call('POST', '/api/favorites/h1/', undefined, token)).json?.count === 3);
  check('DELETE /api/favorites/{id}/', (await call('DELETE', '/api/favorites/q1/', undefined, token)).json?.count === 2);
  check('favorites without token -> 401', (await call('GET', '/api/favorites/')).status === 401);

  // --- logout + account deletion ---
  const second = (await call('POST', '/api/auth/login/', { email, password })).json?.token;
  check('POST /api/auth/logout/', (await call('POST', '/api/auth/logout/', {}, token)).json?.message === 'Logout successful');
  check('old token rejected after logout', (await call('GET', '/api/auth/profile/', undefined, token)).status === 401);
  check('delete account wrong password -> 400', (await call('DELETE', '/api/auth/account/', { password: 'nope-nope' }, second)).status === 400);
  check('DELETE /api/auth/account/', (await call('DELETE', '/api/auth/account/', { password }, second)).status === 200);
  check('login after deletion fails', (await call('POST', '/api/auth/login/', { email, password })).status === 400);

  // --- admin guard ---
  check('admin API requires login', (await call('GET', '/admin/api/stats')).status === 401);

  console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
  process.exit(failures ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
