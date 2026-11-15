// -----------------------------------------------------------------------------
// The key that signs the image keys of the widget, kept in /data so the keys
// survive a restart (the core caches the widget content, image keys included).
// The image key must change with the password, yet never reveal it: it is an
// HMAC of the QR text under this random key, not a plain hash an attacker
// reading the dashboard could brute-force.
// -----------------------------------------------------------------------------

import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createLogger } from '@gladysassistant/integration-sdk';

const logger = createLogger({ name: 'wifi-qr-store' });
const FILE = 'image-key.secret';

/**
 * Reads the signing key from `dir`, creating it on the first start.
 * @param {string} [dir] the writable volume
 * @returns {string} 64 hexadecimal characters
 */
export function loadImageSecret(dir = '/data') {
  const file = join(dir, FILE);
  try {
    const saved = readFileSync(file, 'utf8').trim();
    if (/^[0-9a-f]{64}$/.test(saved)) {
      return saved;
    }
  } catch {
    // First start: created below.
  }
  const secret = randomBytes(32).toString('hex');
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(file, secret, { mode: 0o600 });
  } catch (err) {
    // Without /data the keys only change at each restart: the widget reloads.
    logger.warn(`Cannot save the image key in ${dir} (${err.code ?? err.message})`);
  }
  return secret;
}
