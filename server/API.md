# Europa Angler accounts

The existing Worker serves the static game and `/api/*` from the same origin.
`AccountHub` is a SQLite Durable Object created by the `accounts-v1` Wrangler
migration. No D1 database, external login provider or secrets are required.
Keep the Worker name, Durable Object binding/class, singleton name and migration
history when deploying updates: changing them can disconnect existing accounts.

## Contract

Every response is JSON. Success starts with `{ "ok": true }`; failures have
`{ "ok": false, "error": { "code": "…", "message": "…" } }`.
All API responses use `Cache-Control: private, no-store`; service workers must
exclude `/api/`. Mutation requests require `Content-Type: application/json` and
an `Origin` matching the request URL. Use same-origin fetch credentials.

`user` is `{id,username,createdAt}`. Timestamps are Unix milliseconds.
Metadata is `{user,revision,hasSave,updatedAt,lastUploadId,summary}`; an empty
account has revision 0 and null `updatedAt`, `lastUploadId` and `summary`.
`summary` is `{xp,catches,biggest,prestige,level}`; `biggest` is kilograms.

| Route | Request | Success |
| --- | --- | --- |
| `POST /api/accounts/register` | `{username,password}` | 201: metadata + `recoveryCode` |
| `POST /api/accounts/login` | `{username,password}` | 200: metadata |
| `POST /api/accounts/recover` | `{username,recoveryCode,password}` | 200: metadata + replacement `recoveryCode` |
| `POST /api/accounts/logout` | `{accountId}` | 200: `{ok:true}`; expires current cookie |
| `GET /api/accounts/me` | — | metadata |
| `GET /api/accounts/save?accountId=…` | — | metadata + `userId`, `save` (null when empty) |
| `PUT /api/accounts/save` | `{accountId,baseRevision,uploadId,save}` | `{ok:true,userId,revision,updatedAt,lastUploadId,summary}` |
| `GET /api/leaderboard?metric=xp` | metric `xp`, `catches` or `biggest` | `{ok:true,metric,entries,ownEntry,total,updatedAt}` |

Names are unique without regard to case: 3–24 ASCII letters, digits, underscores
or hyphens. Passwords are 12–128 characters and are never trimmed. Recovery codes
can be entered with/without hyphens or spaces, in either case. Only registration
and successful recovery return a recovery code; store it outside the game.
Recovery replaces the code and password and revokes every existing session.
Logout revokes the current device only. Sessions last 30 days, with at most ten
active sessions per account.

The cookie is `__Host-europa-session`, with `HttpOnly`, `Secure`, `SameSite=Strict`
and `Path=/`. Its random 256-bit token never appears in JSON or JavaScript
storage. SQLite stores only domain-separated SHA-256 hashes of tokens and
high-entropy recovery codes. Passwords use salted native scrypt with
N=32768/r=8/p=3, an OWASP option using about 32 MiB. Memory-intensive password
operations and upload parsing are serialized in a bounded queue. Request bodies
have byte limits and a 15-second read deadline. IP and account-based rate limits
are persistent and return HTTP 429 plus `Retry-After` and `retryAfter` seconds.

## Save safety and retries

`accountId` is required for uploads and should always accompany downloads and
logout. Capture it when the operation begins. If another tab changes the shared
cookie to a different user, the server returns 409 `ACCOUNT_CHANGED` instead of
putting one player's progress into another player's account.

The save object may use the game's compressed history representation. The
serialized UTF-8 save must fit in **4 MiB**. The engine validates its metadata;
compressed histories are validated separately to bound memory. Current schema 5
and the previous production schema 4 are accepted. Newer schemas are rejected.
The submitted save data is retained exactly, including its timestamp, paid
session and extra export metadata; the server does not advance the game clock,
silently truncate history or replace it with the validator's normalized object.
SQLite stores its JSON in BLOB chunks of at most 64 KiB, safely below both SQLite
row limits and the unrelated KV value limit.

`baseRevision` is the last acknowledged revision, initially 0. A unique
`uploadId` must contain 16–100 ASCII letters, digits, underscores or hyphens.
The save chunks, score summary, new revision and retry receipt commit in one
SQLite transaction. A stale base revision returns 409 `REVISION_CONFLICT` with
current `revision`, `updatedAt`, `lastUploadId` and `summary`. Download and ask
the player which progress to retain before retrying against that revision.

Retry the **same uploadId, baseRevision and save** after a lost response. The
latest 128 uploads return their original successful result, plus
`idempotent:true`, even if a later upload has already committed. An old retry
never overwrites newer data. Reusing a retained ID with different content
returns 409 `UPLOAD_ID_REUSED`. Save payload hashes use normal JSON serialization
including object-key order; preserve the original pending payload for retries.
After a page reload, compare `me.lastUploadId` to the locally persisted pending
ID to determine whether a lost upload succeeded. Private data is never addressed
by a user-supplied user ID without checking the authenticated account.

## Community leaderboard

Only accounts with a committed save appear. Each entry contains
`{rank,username,xp,catches,biggest,prestige,level,updatedAt}`. The response includes
the top 100, the authenticated player's own entry even outside the top 100, and
the total number of participating accounts. XP ranks by prestige, then current
XP; catches and biggest fish rank by their lifetime value, then prestige.
Canonical usernames break ties deterministically. No example players are seeded.

The server derives these fields from the validated game save and ignores extra
posted score fields. **This is a community leaderboard, not tamper-proof
competition:** the game runs offline and its save file can be edited. Validation
and account authentication do not prove that a catch really occurred. Server
simulation or verified event logs would be needed for competitive anti-cheat.

## Verification and references

`node tests/accounts-server.test.mjs` uses Node 22's real `node:sqlite` database,
actual scrypt, production save fixtures and concurrent HTTP requests. Its adapter
provides Cloudflare's cursor and transaction interfaces; it does not emulate the
entire Workers runtime. The deploy should also be smoke-tested on the real Worker.

- [Cloudflare SQLite storage and migrations](https://developers.cloudflare.com/durable-objects/best-practices/access-durable-objects-storage/)
- [Cloudflare SQLite limits](https://developers.cloudflare.com/durable-objects/platform/limits/)
- [Cloudflare native Node crypto support](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/)
- [OWASP password storage parameters](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
