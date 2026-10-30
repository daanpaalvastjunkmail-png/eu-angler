import {createHash, randomBytes, scrypt, timingSafeEqual} from 'node:crypto';
import {Buffer} from 'node:buffer';

export const COOKIE_NAME = '__Host-europa-session';
export const SESSION_SECONDS = 30 * 24 * 60 * 60;
export const MAX_SAVE_BYTES = 4 * 1024 * 1024;
export const hash = value => createHash('sha256').update(value).digest('hex');
export const secret = () => randomBytes(32).toString('base64url');
export const recoveryCode = () => randomBytes(20).toString('hex').match(/.{8}/g).join('-');
export const normalizeRecovery = value => typeof value === 'string' ? value.replace(/[\s-]/g, '').toLowerCase() : '';
export const recoveryHash = value => hash('europa-recovery-v1:' + normalizeRecovery(value));
export const sessionHash = value => hash('europa-session-v1:' + value);

export class ApiError extends Error {
  constructor(status, code, message, extra = {}, headers = {}) {
    super(message); Object.assign(this, {status, code, extra, headers});
  }
}
export function json(value, status = 200, extra = {}) {
  return new Response(JSON.stringify(value), {status, headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'private, no-store, max-age=0',
    'Pragma': 'no-cache', 'Vary': 'Cookie', 'X-Content-Type-Options': 'nosniff', ...extra,
  }});
}
export function errorResponse(error) {
  if (error instanceof ApiError) return json({ok: false, error: {code: error.code, message: error.message}, ...error.extra}, error.status, error.headers);
  // Never include request bodies, credentials, SQL or internal errors in a response or log.
  return json({ok: false, error: {code: 'SERVER_ERROR', message: 'De accountservice is tijdelijk niet beschikbaar.'}}, 500);
}
export function protectRequest(request) {
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') throw new ApiError(403, 'ORIGIN_REJECTED', 'Open het spel op het oorspronkelijke speladres.');
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    if (request.headers.get('Origin') !== new URL(request.url).origin) throw new ApiError(403, 'ORIGIN_REJECTED', 'Deze actie moet vanuit het spel worden uitgevoerd.');
    if (request.headers.get('Content-Type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new ApiError(415, 'JSON_REQUIRED', 'Verstuur deze actie als JSON.');
  }
}
export async function readJSON(request, max = 8192) {
  const declared = Number(request.headers.get('Content-Length'));
  if (declared > max) throw new ApiError(413, 'SAVE_TOO_LARGE', 'Dit bestand is te groot voor cloudopslag (maximaal 4 MiB). Je lokale spel blijft behouden.');
  const reader = request.body?.getReader();
  let length = 0, timedOut = false; const chunks = [];
  const deadline = reader && setTimeout(() => { timedOut = true; reader.cancel().catch(() => {}); }, 15000);
  if (reader) try {
    for (;;) {
      const {done, value} = await reader.read();
      if (timedOut) throw new ApiError(408, 'REQUEST_TIMEOUT', 'De upload duurde te lang. Probeer het opnieuw; je voortgang is behouden.');
      if (done) break;
      length += value.byteLength;
      if (length > max) { await reader.cancel(); throw new ApiError(413, 'SAVE_TOO_LARGE', 'Dit bestand is te groot voor cloudopslag (maximaal 4 MiB). Je lokale spel blijft behouden.'); }
      chunks.push(value);
    }
  } finally { clearTimeout(deadline); reader.releaseLock(); }
  const bytes = new Uint8Array(length); let at = 0;
  for (const chunk of chunks) { bytes.set(chunk, at); at += chunk.length; }
  try {
    const value = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes));
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error();
    inspectJSON(value); return value;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, 'INVALID_JSON', 'Deze aanvraag bevat geen geldig JSON-object.');
  }
}
export function inspectJSON(value, depth = 0) {
  if (depth > 32) throw new ApiError(422, 'INVALID_SAVE', 'Het bestand is te diep genest.');
  if (typeof value === 'number' && (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER)) throw new ApiError(422, 'INVALID_SAVE', 'Het bestand bevat een ongeldig getal.');
  if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
    if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new ApiError(422, 'INVALID_SAVE', 'Het bestand bevat een ongeldige eigenschap.');
    inspectJSON(child, depth + 1);
  }
}
export function username(value) {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{3,24}$/.test(value)) throw new ApiError(422, 'INVALID_USERNAME', 'Gebruik 3–24 letters, cijfers, streepjes of underscores voor je spelersnaam.');
  return {display: value, key: value.toLowerCase()};
}
export function password(value) {
  if (typeof value !== 'string' || value.length < 12 || value.length > 128) throw new ApiError(422, 'INVALID_PASSWORD', 'Kies een wachtwoord van 12–128 tekens.');
  return value;
}
// OWASP's memory-conscious scrypt option: N=2^15, r=8, p=3 (~32 MiB).
// Cloudflare's native node:crypto supports scrypt; requests serialize this work.
const scryptKey = (value, salt) => new Promise((resolve, reject) => scrypt(value, salt, 32,
  {N: 32768, r: 8, p: 3, maxmem: 48 * 1024 * 1024}, (error, result) => error ? reject(error) : resolve(result)));
export async function passwordHash(value) {
  const salt = randomBytes(16).toString('hex');
  return `scrypt-32768-8-3$${salt}$${(await scryptKey(value, salt)).toString('hex')}`;
}
export async function passwordMatches(value, stored) {
  const [, salt, expected] = (stored || 'scrypt-32768-8-3$00000000000000000000000000000000$' + '0'.repeat(64)).split('$');
  const actual = await scryptKey(value, salt);
  return equal(actual.toString('hex'), expected);
}
export function equal(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
export function cookie(token = '') {
  return `${COOKIE_NAME}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${token ? SESSION_SECONDS : 0}`;
}
export function tokenFrom(request) {
  const entry = request.headers.get('Cookie')?.split(';').map(part => part.trim()).find(part => part.startsWith(COOKIE_NAME + '='));
  const value = entry?.slice(COOKIE_NAME.length + 1);
  return /^[A-Za-z0-9_-]{43}$/.test(value || '') ? value : null;
}
