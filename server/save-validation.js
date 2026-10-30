import {IdleGame, levelAt} from '../dist/engine.js';
import {SCHEMA_VERSION} from '../dist/tackle.js';
import {SPECIES} from '../dist/data.js';
import {unpackHistory} from '../dist/save-codec.js';
import {ApiError, MAX_SAVE_BYTES} from './security.js';

const fishIds = new Set(SPECIES.map(fish => fish.id));
const largestFish = Math.max(...SPECIES.map(fish => fish.max));
const invalid = () => { throw new ApiError(422, 'INVALID_SAVE', 'Dit bestand is geen geldig Europa Angler-spel. Je huidige cloudopslag blijft behouden.'); };

export function validateSave(raw, now) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) invalid();
  if (raw.schemaVersion > SCHEMA_VERSION) throw new ApiError(409, 'NEWER_SAVE', 'Dit spel is gemaakt met een nieuwere versie. Werk het spel eerst bij.');
  const serialized = JSON.stringify(raw);
  if (new TextEncoder().encode(serialized).byteLength > MAX_SAVE_BYTES) throw new ApiError(413, 'SAVE_TOO_LARGE', 'Je spel is groter dan 4 MiB. Je lokale voortgang blijft behouden; exporteer ook een reservekopie.');
  if (![4, SCHEMA_VERSION].includes(raw.schemaVersion) || !Array.isArray(raw.selectedRods) || !raw.stats || !raw.legacy) invalid();
  if (!Number.isSafeInteger(raw.stats.caught) || raw.stats.caught < 0 || !Number.isFinite(raw.stats.bestWeight) || raw.stats.bestWeight < 0 || raw.stats.bestWeight > largestFish + .01 || !Number.isSafeInteger(raw.legacy.count) || raw.legacy.count < 0) invalid();
  // Decode one history at a time. Store the received save data exactly, using
  // JSON serialization with no clock advance, re-packing or progress truncation.
  // 4 MiB of compressed history cannot allocate a million-row array in one call.
  const history = value => {
    if (value == null) return;
    if (!Array.isArray(value) && (!Number.isSafeInteger(value.count) || typeof value.text !== 'string' || value.count > Math.floor(value.text.length / 8))) invalid();
    let rows; try { rows = unpackHistory(value); } catch { invalid(); }
    if (!Array.isArray(rows)) invalid();
    for (const row of rows) if (!Array.isArray(row) || row.length !== 9 || !fishIds.has(row[1]) || !Number.isFinite(row[2]) || row[2] <= 0 || !Number.isFinite(row[3]) || row[3] < 0 || !Number.isFinite(row[4]) || row[4] < 0 || !Number.isFinite(row[5]) || row[5] < 0) invalid();
  };
  if (raw.sessions != null && (!Array.isArray(raw.sessions) || raw.sessions.length > 8)) invalid();
  for (const journal of raw.sessions || []) { if (!journal || typeof journal !== 'object') invalid(); history(journal.fish); }
  history(raw.session?.fish);
  if (raw.records && Object.keys(raw.records).some(id => !fishIds.has(id))) invalid();
  let validated;
  try {
    const engine = new IdleGame({storage: null, now: () => now});
    validated = engine.validate({...raw,
      session: raw.session ? {...raw.session, fish: []} : raw.session,
      sessions: (raw.sessions || []).map(journal => ({...journal, fish: []})),
    });
  } catch { invalid(); }
  if (raw.session && !validated.session) invalid();
  return {serialized, summary: {
    xp: validated.xp, catches: validated.stats.caught, biggest: validated.stats.bestWeight,
    prestige: validated.legacy.count, level: levelAt(validated.xp),
  }};
}
