import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import fs from 'node:fs/promises';
import worker, {AccountHub} from '../server/index.js';
import {COOKIE_NAME, MAX_SAVE_BYTES, SESSION_SECONDS, sessionHash} from '../server/security.js';
import {IdleGame, xpAt} from '../dist/engine.js';
import {packSave, unpackSave} from '../dist/save-codec.js';

// Exercise actual SQLite statements, UNIQUE constraints and rollback semantics.
// The adapter only supplies Cloudflare's SQL cursor/transactionSync interfaces.
class SQLiteStorage {
  constructor() {
    this.database = new DatabaseSync(':memory:'); this.failNextChunk = false;
    this.sql = {exec: (query, ...args) => {
      if (this.failNextChunk && query.startsWith('INSERT INTO save_chunks')) { this.failNextChunk = false; throw Error('Simulated interrupted storage write'); }
      const rows = this.database.prepare(query).all(...args);
      return {toArray: () => rows, [Symbol.iterator]: () => rows[Symbol.iterator]()};
    }};
  }
  transactionSync(fn) {
    this.database.exec('BEGIN IMMEDIATE');
    try { const value = fn(); this.database.exec('COMMIT'); return value; }
    catch (error) { this.database.exec('ROLLBACK'); throw error; }
  }
}
const storage = new SQLiteStorage(), origin = 'https://europa-angler.example';
let clock = 1793318400000, hub = new AccountHub({storage}, {}); hub.now = () => clock;
const env = {ACCOUNTS: {idFromName: name => name, get: () => ({fetch: request => hub.fetch(request)})}, ASSETS: {fetch: () => new Response('static game')}};
const checks = [], password = 'Drie sterke viswoorden 2026';
let serial = 0;
function request(path, {method = 'GET', body, cookie, ip = '203.0.113.1', originHeader = origin, headers = {}} = {}) {
  const finalHeaders = {'CF-Connecting-IP': ip, ...headers};
  if (cookie) finalHeaders.Cookie = cookie;
  if (method !== 'GET') { finalHeaders.Origin = originHeader; finalHeaders['Content-Type'] ||= 'application/json'; }
  return new Request(origin + path, {method, headers: finalHeaders, ...(body === undefined ? {} : {body: typeof body === 'string' ? body : JSON.stringify(body)})});
}
async function call(path, options) {
  const response = await worker.fetch(request(path, options), env), body = await response.json();
  assert.match(response.headers.get('Cache-Control'), /no-store/);
  assert.equal(response.headers.get('Access-Control-Allow-Origin'), null);
  return {response, body, status: response.status, cookie: response.headers.get('Set-Cookie')?.split(';')[0]};
}
async function register(username, ip = '203.0.113.1') {
  const result = await call('/api/accounts/register', {method: 'POST', body: {username, password}, ip});
  assert.equal(result.status, 201, JSON.stringify(result.body)); return result;
}
function upload(account, save, revision, extras = {}) {
  return {accountId: account.body.user.id, baseRevision: revision, uploadId: 'upload_identifier_' + (++serial), save, ...extras};
}
const getSave = account => call('/api/accounts/save?accountId=' + account.body.user.id, {cookie: account.cookie});

assert.equal((await worker.fetch(request('/'), env)).status, 200);
assert.equal(await (await worker.fetch(request('/'), env)).text(), 'static game');
assert.equal((await call('/api/missing')).status, 404);
assert.equal((await call('/api/accounts/me')).status, 401);
assert.equal((await call('/api/accounts/save')).status, 401);
assert.deepEqual((await call('/api/leaderboard')).body.entries, []);
assert.equal((await call('/api/leaderboard?metric=not-a-metric')).status, 422);
assert.equal((await call('/api/accounts/register', {method: 'POST', body: {username: 'Unsafe', password}, originHeader: 'https://attacker.example'})).status, 403);
assert.equal((await call('/api/accounts/register', {method: 'POST', body: {username: 'Unsafe', password}, originHeader: ''})).status, 403);
assert.equal((await call('/api/accounts/register', {method: 'POST', body: '{}', headers: {'Content-Type': 'text/plain'}})).status, 415);
assert.equal((await call('/api/accounts/register', {method: 'POST', body: '{"__proto__":{"polluted":true}}'})).status, 422);
assert.equal({}.polluted, undefined);
assert.equal((await call('/api/accounts/register', {method: 'POST', body: {username: '<svg>', password}})).status, 422);
assert.equal((await call('/api/accounts/register', {method: 'POST', body: {username: 'Fisher', password: 'short'}})).status, 422);
checks.push('The same-origin API rejects missing/foreign origins, non-JSON mutation, prototype keys, malformed names and weak passwords; static game routing remains intact and scores start empty');

const alice = await register('Alice_Fisher'), bob = await register('Bob_Fisher');
assert.match(alice.response.headers.get('Set-Cookie'), /HttpOnly; Secure; SameSite=Strict/);
assert.match(alice.cookie, new RegExp('^' + COOKIE_NAME + '=[A-Za-z0-9_-]{43}$'));
assert.match(alice.body.recoveryCode, /^[a-f0-9]{8}(?:-[a-f0-9]{8}){4}$/);
assert.equal((await call('/api/accounts/register', {method: 'POST', body: {username: 'alice_fisher', password}})).status, 409);
assert.equal((await call('/api/accounts/login', {method: 'POST', body: {username: 'Alice_Fisher', password: 'The wrong password!'}})).status, 401);
assert.equal((await call('/api/accounts/login', {method: 'POST', body: {username: 'Nobody_here', password}})).status, 401);
const phone = await call('/api/accounts/login', {method: 'POST', body: {username: 'alice_fisher', password}, ip: '203.0.113.2'});
assert.equal(phone.status, 200); assert.notEqual(phone.cookie, alice.cookie); assert.equal(phone.body.user.id, alice.body.user.id);
assert(!JSON.stringify(phone.body).includes('recoveryCode'));
const accountRow = storage.database.prepare('SELECT * FROM accounts WHERE id=?').get(alice.body.user.id);
assert.match(accountRow.password_hash, /^scrypt-32768-8-3\$/);
assert.notEqual(accountRow.password_hash.split('$')[1], storage.database.prepare('SELECT password_hash FROM accounts WHERE id=?').get(bob.body.user.id).password_hash.split('$')[1]);
assert(!accountRow.password_hash.includes(password)); assert.notEqual(accountRow.recovery_hash, alice.body.recoveryCode);
assert.equal(storage.database.prepare('SELECT count(*) AS n FROM sessions WHERE token_hash=?').get(sessionHash(alice.cookie.split('=')[1])).n, 1);
assert.equal(storage.database.prepare('SELECT count(*) AS n FROM sessions WHERE token_hash=?').get(alice.cookie.split('=')[1]).n, 0);
assert.equal((await call('/api/accounts/me', {cookie: alice.cookie})).body.hasSave, false);
assert.equal((await getSave(bob)).body.save, null);
checks.push('Real scrypt hashes, unique salts, hashed 256-bit session tokens, case-insensitive account uniqueness and independent desktop/phone cookies; secrets are returned only when created');

const fixture = JSON.parse(await fs.readFile(new URL('./fixtures/save-3.1.2.json', import.meta.url), 'utf8'));
const firstUpload = upload(alice, fixture, 0);
let result = await call('/api/accounts/save', {method: 'PUT', cookie: alice.cookie, body: firstUpload});
assert.equal(result.status, 200, JSON.stringify(result.body)); assert.equal(result.body.revision, 1); assert.equal(result.body.lastUploadId, firstUpload.uploadId);
let downloaded = await getSave(phone);
assert.deepEqual(downloaded.body.save, fixture); assert.equal(downloaded.body.userId, alice.body.user.id);
assert.equal(downloaded.body.summary.catches, fixture.stats.caught); assert.equal(downloaded.body.summary.xp, fixture.xp);
assert.equal(downloaded.body.save.lastAt, fixture.lastAt, 'Server never advances an offline session');
assert.equal((await getSave(bob)).body.save, null, 'A second account cannot read the first account save');
assert.equal((await call('/api/accounts/save?accountId=' + alice.body.user.id, {cookie: bob.cookie})).body.error.code, 'ACCOUNT_CHANGED');
assert.equal((await call('/api/accounts/save', {method: 'PUT', cookie: bob.cookie, body: upload(alice, fixture, 0)})).body.error.code, 'ACCOUNT_CHANGED');
assert.equal((await call('/api/accounts/save', {method: 'PUT', cookie: alice.cookie, body: {...firstUpload, accountId: undefined}})).body.error.code, 'ACCOUNT_CHANGED');
assert.equal((await call('/api/accounts/logout', {method: 'POST', cookie: bob.cookie, body: {accountId: alice.body.user.id}})).body.error.code, 'ACCOUNT_CHANGED');
assert.equal((await call('/api/accounts/me', {cookie: bob.cookie})).status, 200);
checks.push('A real compressed 3.1.2 save transfers exactly to a phone, with its pending paid session and timestamp intact; account switching and private cloud saves are isolated');

result = await call('/api/accounts/save', {method: 'PUT', cookie: alice.cookie, body: firstUpload});
assert.equal(result.status, 200); assert.equal(result.body.revision, 1); assert.equal(result.body.idempotent, true);
result = await call('/api/accounts/save', {method: 'PUT', cookie: alice.cookie, body: {...firstUpload, save: {...fixture, money: fixture.money + 1}}});
assert.equal(result.body.error.code, 'UPLOAD_ID_REUSED');
const raceA = upload(alice, {...fixture, money: fixture.money + 10}, 1), raceB = upload(alice, {...fixture, money: fixture.money + 20}, 1);
const race = await Promise.all([
  call('/api/accounts/save', {method: 'PUT', cookie: alice.cookie, body: raceA}),
  call('/api/accounts/save', {method: 'PUT', cookie: phone.cookie, body: raceB}),
]);
assert.deepEqual(race.map(r => r.status).sort(), [200, 409]);
const loser = race.find(r => r.status === 409); assert.equal(loser.body.error.code, 'REVISION_CONFLICT'); assert.equal(loser.body.revision, 2);
const winningBody = race[0].status === 200 ? raceA : raceB;
assert.deepEqual((await getSave(alice)).body.save, winningBody.save);
assert.equal((await call('/api/accounts/me', {cookie: phone.cookie})).body.lastUploadId, winningBody.uploadId, 'A lost response is recoverable after a client reload');
result = await call('/api/accounts/save', {method: 'PUT', cookie: alice.cookie, body: firstUpload});
assert.equal(result.body.revision, 1); assert.equal((await getSave(alice)).body.revision, 2, 'An old repeated upload never moves cloud progress backward');
storage.failNextChunk = true;
result = await call('/api/accounts/save', {method: 'PUT', cookie: alice.cookie, body: upload(alice, fixture, 2)});
assert.equal(result.status, 500); assert(!JSON.stringify(result.body).includes('Simulated'));
assert.deepEqual((await getSave(alice)).body.save, winningBody.save); assert.equal((await getSave(alice)).body.revision, 2);
checks.push('Concurrent devices have exactly one CAS winner, lost responses are idempotent and discoverable through lastUploadId, reused identifiers are rejected, and interrupted SQLite writes roll back without losing the previous save');

for (const changed of [
  {...fixture, schemaVersion: 999}, {...fixture, xp: -1}, {...fixture, stats: {...fixture.stats, caught: 1.2}},
  {...fixture, stats: {...fixture.stats, bestWeight: 1e12}}, {...fixture, records: {invented_fish: {count: 1, best: 1}}},
  {...fixture, session: {...fixture.session, fish: {...fixture.session.fish, count: 1000000}}},
]) {
  result = await call('/api/accounts/save', {method: 'PUT', cookie: alice.cookie, body: upload(alice, changed, 2)});
  assert([409, 422].includes(result.status), JSON.stringify(result.body));
}
const forged = JSON.stringify(upload(alice, fixture, 2)).replace('"save":{', '"save":{"constructor":{"prototype":{"polluted":true}},');
assert.equal((await call('/api/accounts/save', {method: 'PUT', cookie: alice.cookie, body: forged})).status, 422);
assert.equal({}.polluted, undefined);
const oversized = JSON.stringify(upload(alice, {...fixture, padding: 'x'.repeat(MAX_SAVE_BYTES)}, 2));
assert.equal((await call('/api/accounts/save', {method: 'PUT', cookie: alice.cookie, body: oversized})).status, 413);
assert.equal((await getSave(alice)).body.revision, 2);
checks.push('Future schemas, invalid balances/metrics, unknown fish, corrupt compressed history, prototype pollution and oversized saves are rejected without changing the previous cloud save');

clock += 61000;
const modernGame = new IdleGame({storage: null, now: () => clock});
modernGame.state.xp = xpAt(60); modernGame.state.stats.caught = 820; modernGame.state.stats.bestWeight = 18.25;
modernGame.state.records.linear_spiegel = {count: 1, best: 18.25};
const largeSave = packSave(modernGame.state);
// Exercise storage beyond both KV's 128 KiB and SQLite's 2 MiB row limit. Unknown
// export metadata is preserved too; it is never trusted for public score fields.
largeSave.exportNote = '🎣漢'.repeat(330000);
const largePayload = upload(alice, largeSave, 2, {score: 1e12, xp: 1e12, catches: 1e12});
result = await call('/api/accounts/save', {method: 'PUT', cookie: alice.cookie, body: largePayload});
assert.equal(result.status, 200, JSON.stringify(result.body)); assert.equal(result.body.summary.xp, modernGame.state.xp); assert.equal(result.body.summary.catches, 820);
const chunks = storage.database.prepare('SELECT length(data) AS bytes FROM save_chunks WHERE account_id=?').all(alice.body.user.id);
assert(chunks.length > 32); assert(chunks.every(chunk => chunk.bytes <= 65536));
assert.deepEqual((await getSave(alice)).body.save, largeSave, 'Multi-megabyte UTF-8 data survives arbitrary chunk boundaries');
hub = new AccountHub({storage}, {}); hub.now = () => clock;
assert.deepEqual((await getSave(phone)).body.save, largeSave, 'No account data depends on a warm Durable Object instance');
const bobGame = new IdleGame({storage: null, now: () => clock}); bobGame.state.legacy.count = 1; bobGame.state.xp = 20; bobGame.state.stats.caught = 2; bobGame.state.stats.bestWeight = .5;
result = await call('/api/accounts/save', {method: 'PUT', cookie: bob.cookie, body: upload(bob, packSave(bobGame.state), 0)}); assert.equal(result.status, 200);
const xpBoard = (await call('/api/leaderboard?metric=xp', {cookie: alice.cookie})).body;
assert.equal(xpBoard.total, 2); assert.equal(xpBoard.entries[0].username, 'Bob_Fisher'); assert.equal(xpBoard.ownEntry.rank, 2);
for (const metric of ['catches', 'biggest']) {
  const board = (await call('/api/leaderboard?metric=' + metric)).body;
  assert.equal(board.entries[0].username, 'Alice_Fisher'); assert.equal(board.ownEntry, null);
  for (const entry of board.entries) assert.deepEqual(Object.keys(entry).sort(), ['rank','username','xp','catches','biggest','prestige','level','updatedAt'].sort());
}
assert.equal(xpBoard.entries[1].xp, modernGame.state.xp); assert.equal(xpBoard.entries[1].catches, 820);
// Populate only this in-memory test database to exercise ranks below the page.
// The production constructor never inserts example accounts or scores.
for (let i = 0; i < 101; i++) storage.database.prepare(`INSERT INTO accounts
  (id,username,name_key,password_hash,recovery_hash,created_at,revision,xp,catches,biggest,prestige,level,updated_at)
  VALUES (?,?,?,?,?,?,1,1000000,10000,100,5,99,?)`).run(
  'rank-fixture-' + i, 'RankFixture' + i, 'rankfixture' + String(i).padStart(3, '0'), accountRow.password_hash, accountRow.recovery_hash, clock, clock);
const belowPage = (await call('/api/leaderboard?metric=xp', {cookie: alice.cookie})).body;
assert.equal(belowPage.total, 103); assert.equal(belowPage.entries.length, 100);
assert.equal(belowPage.ownEntry.username, 'Alice_Fisher'); assert.equal(belowPage.ownEntry.rank, 103);
assert(!belowPage.entries.some(entry => entry.username === 'Alice_Fisher'));
storage.database.prepare("DELETE FROM accounts WHERE id LIKE 'rank-fixture-%'").run();
checks.push('Multi-megabyte Unicode saves use 64 KiB SQL chunks and survive object restarts; public scores are derived from the validated save, with prestige-aware XP, accurate own ranks and no private fields or invented players');

result = await call('/api/accounts/recover', {method: 'POST', body: {username: 'Alice_Fisher', recoveryCode: 'wrong', password}, ip: '203.0.113.3'});
assert.equal(result.status, 401);
const newPassword = 'Een nieuw veilig wachtwoord 2027';
const recovered = await call('/api/accounts/recover', {method: 'POST', body: {username: 'Alice_Fisher', recoveryCode: alice.body.recoveryCode.toUpperCase(), password: newPassword}, ip: '203.0.113.3'});
assert.equal(recovered.status, 200); assert.notEqual(recovered.body.recoveryCode, alice.body.recoveryCode);
for (const oldCookie of [alice.cookie, phone.cookie]) assert.equal((await call('/api/accounts/me', {cookie: oldCookie})).status, 401);
assert.equal((await getSave(recovered)).body.revision, 3);
assert.equal((await call('/api/accounts/recover', {method: 'POST', body: {username: 'Alice_Fisher', recoveryCode: alice.body.recoveryCode, password}, ip: '203.0.113.3'})).status, 401);
assert.equal((await call('/api/accounts/login', {method: 'POST', body: {username: 'Alice_Fisher', password}, ip: '203.0.113.4'})).status, 401);
const loggedIn = await call('/api/accounts/login', {method: 'POST', body: {username: 'Alice_Fisher', password: newPassword}, ip: '203.0.113.4'}); assert.equal(loggedIn.status, 200);
let uploadStream;
const slowBody = new ReadableStream({start(controller) { uploadStream = controller; }});
const inFlight = worker.fetch(new Request(origin + '/api/accounts/save', {method: 'PUT', body: slowBody, duplex: 'half', headers: {
  Origin: origin, 'Content-Type': 'application/json', Cookie: loggedIn.cookie, 'CF-Connecting-IP': '203.0.113.4',
}}), env);
await new Promise(resolve => setImmediate(resolve));
result = await call('/api/accounts/logout', {method: 'POST', cookie: loggedIn.cookie, body: {accountId: alice.body.user.id}});
assert.equal(result.status, 200); assert.match(result.response.headers.get('Set-Cookie'), /Max-Age=0/);
uploadStream.enqueue(new TextEncoder().encode(JSON.stringify(upload(alice, packSave(modernGame.state), 3)))); uploadStream.close();
assert.equal((await inFlight).status, 401, 'An upload whose session was revoked while streaming cannot commit');
assert.equal((await getSave(recovered)).body.revision, 3);
assert.equal((await call('/api/accounts/me', {cookie: loggedIn.cookie})).status, 401);
assert.equal((await call('/api/accounts/me', {cookie: recovered.cookie})).status, 200, 'Logging out one device does not log out another');
checks.push('Recovery changes the password, rotates its one-time code and revokes every previous session without touching saves; logout revokes only its own session and stops an already-streaming upload from committing');

for (let i = 0; i < 8; i++) assert.equal((await call('/api/accounts/login', {method: 'POST', body: {username: 'Guessing_Name', password}, ip: '198.51.100.1'})).status, 401);
result = await call('/api/accounts/login', {method: 'POST', body: {username: 'Guessing_Name', password}, ip: '198.51.100.1'});
assert.equal(result.status, 429); assert(Number(result.response.headers.get('Retry-After')) > 0);
for (let i = 0; i < 5; i++) assert.equal((await call('/api/accounts/recover', {method: 'POST', body: {username: 'Guessing_Name', password, recoveryCode: 'wrong'}, ip: '198.51.100.2'})).status, 401);
assert.equal((await call('/api/accounts/recover', {method: 'POST', body: {username: 'Guessing_Name', password, recoveryCode: 'wrong'}, ip: '198.51.100.2'})).status, 429);
clock += (SESSION_SECONDS + 1) * 1000;
assert.equal((await call('/api/accounts/me', {cookie: recovered.cookie})).status, 401);
assert.equal((await call('/api/accounts/me', {cookie: bob.cookie})).status, 401);
assert.equal((await call('/api/leaderboard')).body.total, 2, 'Session expiry never deletes saved progress');
checks.push('Persistent IP/account rate limits stop password and recovery guessing before further hash work, cookies expire, and expiry never deletes progress');

const config = JSON.parse(await fs.readFile(new URL('../wrangler.json', import.meta.url), 'utf8'));
assert.equal(config.name, 'europa-angler'); assert.equal(config.main, 'server/index.js'); assert(config.compatibility_flags.includes('nodejs_compat'));
assert.equal(config.assets.binding, 'ASSETS'); assert(config.assets.run_worker_first.includes('/api/*'));
assert(config.durable_objects.bindings.some(binding => binding.class_name === 'AccountHub' && binding.name === 'ACCOUNTS'));
assert(config.migrations.some(migration => migration.new_sqlite_classes.includes('AccountHub')));
storage.database.close();
console.log(JSON.stringify({status: 'PASS', groups: checks.length, checks, storage: 'real SQLite transactions', passwords: 'real native scrypt N32768/r8/p3'}, null, 2));
