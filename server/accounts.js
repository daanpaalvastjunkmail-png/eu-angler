import {ApiError, MAX_SAVE_BYTES, SESSION_SECONDS, cookie, equal, errorResponse, hash, json,
  normalizeRecovery, password, passwordHash, passwordMatches, protectRequest, readJSON,
  recoveryCode, recoveryHash, secret, sessionHash, tokenFrom, username} from './security.js';
import {validateSave} from './save-validation.js';

const AUTH_FAILURE = () => new ApiError(401, 'INVALID_CREDENTIALS', 'De spelersnaam en het wachtwoord of de herstelcode kloppen niet.');
const NO_ACCOUNT = () => new ApiError(401, 'NOT_AUTHENTICATED', 'Log eerst in op je account.');
const CHANGED_ACCOUNT = () => new ApiError(409, 'ACCOUNT_CHANGED', 'In een ander tabblad is een ander account geopend. Vernieuw de accountstatus voordat je verdergaat.');
const HOUR = 3600000;
const userView = row => ({id: row.id, username: row.username, createdAt: row.created_at});
const summary = row => row.revision ? {xp: row.xp, catches: row.catches, biggest: row.biggest, prestige: row.prestige, level: row.level} : null;
const metadata = row => ({user: userView(row), revision: row.revision, hasSave: row.revision > 0,
  updatedAt: row.updated_at, lastUploadId: row.last_upload_id, summary: summary(row)});

/** One SQLite Durable Object serializes account writes and save revisions.
 * Game progress is client-authored: these are community scores, not anti-cheat.
 */
export class AccountHub {
  constructor(ctx, env) {
    this.ctx = ctx; this.env = env; this.sql = ctx.storage.sql;
    this.now = () => Date.now(); this.hashTail = Promise.resolve(); this.hashWaiting = 0; this.nextSweep = 0;
    this.sql.exec(`CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY, username TEXT NOT NULL, name_key TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL, recovery_hash TEXT NOT NULL, auth_version INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL, revision INTEGER NOT NULL DEFAULT 0, updated_at INTEGER,
      last_upload_id TEXT, xp REAL NOT NULL DEFAULT 0, catches INTEGER NOT NULL DEFAULT 0,
      biggest REAL NOT NULL DEFAULT 0, prestige INTEGER NOT NULL DEFAULT 0, level INTEGER NOT NULL DEFAULT 1
    )`);
    this.sql.exec('CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, account_id TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)');
    this.sql.exec('CREATE INDEX IF NOT EXISTS sessions_account ON sessions(account_id, created_at)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS save_chunks (account_id TEXT NOT NULL, part INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY(account_id, part))');
    this.sql.exec('CREATE TABLE IF NOT EXISTS uploads (account_id TEXT NOT NULL, upload_id TEXT NOT NULL, payload_hash TEXT NOT NULL, revision INTEGER NOT NULL, updated_at INTEGER NOT NULL, summary_json TEXT NOT NULL, PRIMARY KEY(account_id, upload_id))');
    this.sql.exec('CREATE TABLE IF NOT EXISTS rate_limits (bucket TEXT PRIMARY KEY, count INTEGER NOT NULL, expires_at INTEGER NOT NULL)');
    this.sql.exec('CREATE INDEX IF NOT EXISTS leaderboard_xp ON accounts(prestige DESC, xp DESC, name_key)');
    this.sql.exec('CREATE INDEX IF NOT EXISTS leaderboard_catches ON accounts(catches DESC, prestige DESC, name_key)');
    this.sql.exec('CREATE INDEX IF NOT EXISTS leaderboard_biggest ON accounts(biggest DESC, prestige DESC, name_key)');
  }
  one(query, ...params) { return this.sql.exec(query, ...params).toArray()[0] || null; }
  account(id) { return this.one('SELECT * FROM accounts WHERE id = ?', id); }
  transaction(callback) { return this.ctx.storage.transactionSync(callback); }
  sweep() {
    const now = this.now(); if (now < this.nextSweep) return;
    this.sql.exec('DELETE FROM sessions WHERE expires_at <= ?', now);
    this.sql.exec('DELETE FROM rate_limits WHERE expires_at <= ?', now);
    this.nextSweep = now + HOUR;
  }
  rate(key, limit, duration) {
    const now = this.now(), bucket = hash(key), row = this.one('SELECT count, expires_at FROM rate_limits WHERE bucket = ?', bucket);
    if (row && row.expires_at > now && row.count >= limit) {
      const seconds = Math.max(1, Math.ceil((row.expires_at - now) / 1000));
      throw new ApiError(429, 'RATE_LIMITED', 'Te veel pogingen. Probeer het later opnieuw.', {retryAfter: seconds}, {'Retry-After': String(seconds)});
    }
    this.sql.exec('INSERT INTO rate_limits (bucket, count, expires_at) VALUES (?, ?, ?) ON CONFLICT(bucket) DO UPDATE SET count=excluded.count, expires_at=excluded.expires_at',
      bucket, row && row.expires_at > now ? row.count + 1 : 1, row && row.expires_at > now ? row.expires_at : now + duration);
  }
  async hashWork(callback) {
    // The same bounded queue covers upload parsing/validation and scrypt, so
    // several large uploads cannot amplify memory while a password is hashing.
    if (this.hashWaiting >= 8) throw new ApiError(503, 'BUSY', 'De accountservice is druk. Probeer het over enkele seconden opnieuw.', {}, {'Retry-After': '3'});
    this.hashWaiting++;
    const previous = this.hashTail; let release;
    this.hashTail = new Promise(resolve => { release = resolve; });
    try { await previous; return await callback(); } finally { this.hashWaiting--; release(); }
  }
  authenticate(request, optional = false) {
    const token = tokenFrom(request);
    const row = token && this.one(`SELECT a.* FROM accounts a JOIN sessions s ON s.account_id = a.id
      WHERE s.token_hash = ? AND s.expires_at > ?`, sessionHash(token), this.now());
    if (!row && !optional) throw NO_ACCOUNT(); return row || null;
  }
  guardAccount(row, expected, required = false) {
    if ((required && typeof expected !== 'string') || (expected !== undefined && expected !== null && expected !== row.id)) throw CHANGED_ACCOUNT();
  }
  issueSession(accountId) {
    const token = secret(), now = this.now();
    this.sql.exec('INSERT INTO sessions (token_hash, account_id, created_at, expires_at) VALUES (?, ?, ?, ?)', sessionHash(token), accountId, now, now + SESSION_SECONDS * 1000);
    this.sql.exec('DELETE FROM sessions WHERE account_id = ? AND token_hash NOT IN (SELECT token_hash FROM sessions WHERE account_id = ? ORDER BY created_at DESC, rowid DESC LIMIT 10)', accountId, accountId);
    return token;
  }
  async fetch(request) {
    try {
      protectRequest(request); this.sweep();
      const url = new URL(request.url), route = `${request.method} ${url.pathname}`;
      const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
      if (['POST /api/accounts/register', 'POST /api/accounts/login', 'POST /api/accounts/recover'].includes(route)) {
        this.rate('auth-ip:' + ip, 30, 15 * 60000);
        const body = await readJSON(request), name = username(body.username), pass = password(body.password);
        if (route.endsWith('/register')) return await this.register(name, pass, ip);
        if (route.endsWith('/recover')) return await this.recover(name, pass, body.recoveryCode, ip);
        return await this.login(name, pass, ip);
      }
      if (route === 'GET /api/leaderboard') {
        this.rate('board:' + ip, 120, 60000); return this.leaderboard(request, url);
      }
      if (!['GET /api/accounts/me', 'GET /api/accounts/save', 'PUT /api/accounts/save', 'POST /api/accounts/logout'].includes(route)) throw new ApiError(404, 'NOT_FOUND', 'Deze accountactie bestaat niet.');
      const account = this.authenticate(request);
      this.rate('account:' + account.id, 120, 60000);
      if (route === 'GET /api/accounts/me') return json({ok: true, ...metadata(account)});
      if (route === 'POST /api/accounts/logout') {
        const body = await readJSON(request); this.guardAccount(account, body.accountId);
        this.sql.exec('DELETE FROM sessions WHERE token_hash = ?', sessionHash(tokenFrom(request)));
        return json({ok: true}, 200, {'Set-Cookie': cookie()});
      }
      if (route === 'GET /api/accounts/save') {
        this.guardAccount(account, url.searchParams.get('accountId'));
        const chunks = this.sql.exec('SELECT data FROM save_chunks WHERE account_id = ? ORDER BY part', account.id).toArray();
        let save = null;
        if (account.revision) {
          const parts = chunks.map(chunk => new Uint8Array(chunk.data));
          const bytes = new Uint8Array(parts.reduce((n, part) => n + part.byteLength, 0)); let offset = 0;
          for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
          save = JSON.parse(new TextDecoder().decode(bytes));
        }
        return json({ok: true, ...metadata(account), userId: account.id, save});
      }
      this.rate('uploads:' + account.id, 30, 60000);
      return await this.hashWork(async () => {
        this.authenticate(request);
        const body = await readJSON(request, MAX_SAVE_BYTES + 4096);
        this.guardAccount(account, body.accountId, true);
        if (!Number.isSafeInteger(body.baseRevision) || body.baseRevision < 0 || typeof body.uploadId !== 'string' || !/^[A-Za-z0-9_-]{16,100}$/.test(body.uploadId)) throw new ApiError(422, 'INVALID_UPLOAD', 'Deze upload mist een geldige revisie of uploadcode.');
        const checked = validateSave(body.save, this.now());
        // Reauthenticate after reading the stream: logout may revoke the session
        // while its body is arriving. CAS and account guard run again atomically.
        return this.transaction(() => {
          const current = this.authenticate(request); this.guardAccount(current, body.accountId, true);
          return this.putSave(current, body, checked);
        });
      });
    } catch (error) { return errorResponse(error); }
  }
  async register(name, pass, ip) {
    this.rate('register:' + ip, 5, HOUR);
    const exists = this.one('SELECT id FROM accounts WHERE name_key = ?', name.key);
    if (exists) throw new ApiError(409, 'USERNAME_TAKEN', 'Deze spelersnaam is al in gebruik.');
    const encoded = await this.hashWork(() => passwordHash(pass)), recovery = recoveryCode(), id = secret();
    return this.transaction(() => {
      if (this.one('SELECT id FROM accounts WHERE name_key = ?', name.key)) throw new ApiError(409, 'USERNAME_TAKEN', 'Deze spelersnaam is al in gebruik.');
      this.sql.exec('INSERT INTO accounts (id, username, name_key, password_hash, recovery_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)', id, name.display, name.key, encoded, recoveryHash(recovery), this.now());
      const token = this.issueSession(id);
      return json({ok: true, ...metadata(this.account(id)), recoveryCode: recovery}, 201, {'Set-Cookie': cookie(token)});
    });
  }
  async login(name, pass, ip) {
    this.rate('login-name:' + name.key, 12, 15 * 60000);
    this.rate('login-pair:' + ip + ':' + name.key, 8, 15 * 60000);
    const row = this.one('SELECT * FROM accounts WHERE name_key = ?', name.key);
    const matches = await this.hashWork(() => passwordMatches(pass, row?.password_hash));
    return this.transaction(() => {
      const current = row && this.account(row.id);
      if (!matches || !current || current.auth_version !== row.auth_version) throw AUTH_FAILURE();
      const token = this.issueSession(row.id);
      return json({ok: true, ...metadata(current)}, 200, {'Set-Cookie': cookie(token)});
    });
  }
  async recover(name, pass, code, ip) {
    this.rate('recover-ip:' + ip, 5, HOUR); this.rate('recover-name:' + name.key, 5, HOUR);
    const row = this.one('SELECT * FROM accounts WHERE name_key = ?', name.key);
    const codeHash = recoveryHash(code);
    if (!/^[a-f0-9]{40}$/.test(normalizeRecovery(code)) || !row || !equal(codeHash, row.recovery_hash)) throw AUTH_FAILURE();
    const encoded = await this.hashWork(() => passwordHash(pass)), recovery = recoveryCode();
    return this.transaction(() => {
      const current = this.account(row.id);
      if (!current || !equal(current.recovery_hash, codeHash) || current.auth_version !== row.auth_version) throw AUTH_FAILURE();
      this.sql.exec('UPDATE accounts SET password_hash = ?, recovery_hash = ?, auth_version = auth_version + 1 WHERE id = ?', encoded, recoveryHash(recovery), row.id);
      this.sql.exec('DELETE FROM sessions WHERE account_id = ?', row.id);
      const token = this.issueSession(row.id);
      return json({ok: true, ...metadata(this.account(row.id)), recoveryCode: recovery}, 200, {'Set-Cookie': cookie(token)});
    });
  }
  putSave(account, body, checked) {
    const digest = hash(JSON.stringify({baseRevision: body.baseRevision, save: body.save}));
    const previous = this.one('SELECT * FROM uploads WHERE account_id = ? AND upload_id = ?', account.id, body.uploadId);
    if (previous) {
      if (!equal(previous.payload_hash, digest)) throw new ApiError(409, 'UPLOAD_ID_REUSED', 'Deze uploadcode is eerder gebruikt voor andere voortgang.');
      return json({ok: true, userId: account.id, revision: previous.revision, updatedAt: previous.updated_at, lastUploadId: body.uploadId, summary: JSON.parse(previous.summary_json), idempotent: true});
    }
    if (account.revision !== body.baseRevision) throw new ApiError(409, 'REVISION_CONFLICT', 'Een ander apparaat heeft nieuwere voortgang opgeslagen. Kies eerst welke voortgang je wilt bewaren.',
      {revision: account.revision, updatedAt: account.updated_at, lastUploadId: account.last_upload_id, summary: summary(account)});
    const revision = account.revision + 1, updatedAt = this.now(), bytes = new TextEncoder().encode(checked.serialized), s = checked.summary;
    this.sql.exec('DELETE FROM save_chunks WHERE account_id = ?', account.id);
    for (let at = 0, part = 0; at < bytes.length; at += 65536, part++) this.sql.exec('INSERT INTO save_chunks (account_id, part, data) VALUES (?, ?, ?)', account.id, part, bytes.slice(at, at + 65536));
    this.sql.exec('UPDATE accounts SET revision = ?, updated_at = ?, last_upload_id = ?, xp = ?, catches = ?, biggest = ?, prestige = ?, level = ? WHERE id = ?', revision, updatedAt, body.uploadId, s.xp, s.catches, s.biggest, s.prestige, s.level, account.id);
    this.sql.exec('INSERT INTO uploads (account_id, upload_id, payload_hash, revision, updated_at, summary_json) VALUES (?, ?, ?, ?, ?, ?)', account.id, body.uploadId, digest, revision, updatedAt, JSON.stringify(s));
    // The latest 128 acknowledged uploads retain their exact idempotent response.
    // Older retries still cannot overwrite anything: their base revision is stale.
    this.sql.exec('DELETE FROM uploads WHERE account_id = ? AND revision NOT IN (SELECT revision FROM uploads WHERE account_id = ? ORDER BY revision DESC LIMIT 128)', account.id, account.id);
    return json({ok: true, userId: account.id, revision, updatedAt, lastUploadId: body.uploadId, summary: s});
  }
  leaderboard(request, url) {
    const metric = url.searchParams.get('metric') || 'xp';
    const orders = {xp: 'prestige DESC, xp DESC, name_key ASC', catches: 'catches DESC, prestige DESC, name_key ASC', biggest: 'biggest DESC, prestige DESC, name_key ASC'};
    if (!Object.hasOwn(orders, metric)) throw new ApiError(422, 'INVALID_METRIC', 'Kies xp, catches of biggest.');
    const ranked = `WITH ranked AS (SELECT id, username, xp, catches, biggest, prestige, level, updated_at AS updatedAt,
      ROW_NUMBER() OVER (ORDER BY ${orders[metric]}) AS rank FROM accounts WHERE revision > 0)`;
    const publicRow = row => row ? {rank: row.rank, username: row.username, xp: row.xp, catches: row.catches, biggest: row.biggest, prestige: row.prestige, level: row.level, updatedAt: row.updatedAt} : null;
    const entries = this.sql.exec(ranked + ' SELECT * FROM ranked ORDER BY rank LIMIT 100').toArray().map(publicRow);
    const account = this.authenticate(request, true);
    const ownEntry = account ? publicRow(this.one(ranked + ' SELECT * FROM ranked WHERE id = ?', account.id)) : null;
    const total = this.one('SELECT COUNT(*) AS total FROM accounts WHERE revision > 0').total;
    return json({ok: true, metric, entries, ownEntry, total, updatedAt: this.now()});
  }
}
