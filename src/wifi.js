// -----------------------------------------------------------------------------
// The Wi-Fi QR code text, in the format phone cameras read (ZXing's "WIFI:"
// scheme, taken up by the Wi-Fi Alliance for Easy Connect):
//
//   WIFI:T:WPA;S:<ssid>;P:<password>;H:false;;
//
// `\ ; , : "` are escaped with a backslash inside S and P: a `;` left as is
// ends the field, and a phone then joins a network that does not exist.
// -----------------------------------------------------------------------------

import { SECURITY } from './config.js';

const SPECIAL = /[\\;,:"]/g;
const utf8Length = (value) => Buffer.byteLength(value, 'utf8');

/** Escapes a value of the S or P field. */
export function escapeWifi(value) {
  return value.replace(SPECIAL, (char) => `\\${char}`);
}

/**
 * The text encoded in the QR code of a network.
 * @param {{ ssid: string, security: string, password: string, hidden: boolean }} network
 */
export function wifiPayload({ ssid, security, password, hidden }) {
  const type = SECURITY[security];
  const parts = [`T:${type}`, `S:${escapeWifi(ssid)}`];
  if (type !== 'nopass') {
    parts.push(`P:${escapeWifi(password)}`);
  }
  parts.push(`H:${hidden ? 'true' : 'false'}`);
  return `WIFI:${parts.join(';')};;`;
}

/**
 * What prevents a QR code that works, as the key of a PROBLEM_TEXT entry, or
 * null. The bounds are the ones of 802.11: an SSID holds 32 bytes, a WPA
 * passphrase 8 to 63 characters (or 64 hexadecimal digits, the raw key), a
 * WEP key 5 or 13 characters (or 10 or 26 hexadecimal digits).
 * @returns {null | 'ssid_too_long' | 'password_missing' | 'password_length' | 'wep_length'}
 */
export function networkProblem({ ssid, security, password }) {
  if (utf8Length(ssid) > 32) {
    return 'ssid_too_long';
  }
  if (security === 'none') {
    return null;
  }
  if (password === '') {
    return 'password_missing';
  }
  if ((security === 'wpa' || security === 'sae') && !isWpaPassword(password)) {
    return 'password_length';
  }
  if (security === 'wep' && !/^(.{5}|.{13}|[0-9a-fA-F]{10}|[0-9a-fA-F]{26})$/u.test(password)) {
    return 'wep_length';
  }
  return null;
}

function isWpaPassword(password) {
  if (/^[0-9a-fA-F]{64}$/.test(password)) {
    return true;
  }
  // The standard counts ASCII characters; routers that accept accents count
  // the UTF-8 bytes, which is the stricter reading.
  return password.length >= 8 && utf8Length(password) <= 63;
}
