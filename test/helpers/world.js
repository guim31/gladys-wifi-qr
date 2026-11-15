// -----------------------------------------------------------------------------
// A running integration against the SDK's fake Gladys, a fixed image key and
// no /data. No network. Also a QR code reader (jsQR on the PNG pixels) and a
// parser of the "WIFI:" text, the way a phone camera reads them.
// -----------------------------------------------------------------------------

import { createFakeGladys } from '@gladysassistant/integration-sdk/testing';
import jsQR from 'jsqr';
import { PNG } from 'pngjs';
import { registerHandlers } from '../../src/app.js';

export const SECRET = 'ab'.repeat(32);

/**
 * @param {object} [options]
 * @param {object} [options.config] the configuration saved in Gladys
 * @param {boolean} [options.connect] false: handlers registered, not started
 */
export async function createWorld({ config = {}, connect = true } = {}) {
  const gladys = createFakeGladys({ config });
  const app = registerHandlers(gladys, { secret: SECRET });
  if (connect) {
    await gladys.connect();
  }
  return { gladys, app };
}

/** The text of the QR code in a PNG (Buffer or base64), as UTF-8. */
export function readQr(png) {
  const image = PNG.sync.read(Buffer.isBuffer(png) ? png : Buffer.from(png, 'base64'));
  const code = jsQR(new Uint8ClampedArray(image.data), image.width, image.height);
  if (!code) {
    throw new Error('No QR code found');
  }
  return Buffer.from(code.binaryData).toString('utf8');
}

/**
 * Parses a "WIFI:" text like ZXing's WifiResultParser: fields split on an
 * unescaped ";", a backslash takes the next character literally.
 */
export function parseWifi(text) {
  if (!text.startsWith('WIFI:') || !text.endsWith(';;')) {
    throw new Error(`Not a Wi-Fi QR text: ${text}`);
  }
  const fields = {};
  let key = '';
  let value = '';
  let inValue = false;
  for (let i = 5; i < text.length; i += 1) {
    const char = text[i];
    if (char === '\\' && inValue) {
      i += 1;
      value += text[i];
    } else if (!inValue && char === ':') {
      inValue = true;
    } else if (inValue && char === ';') {
      fields[key] = value;
      key = '';
      value = '';
      inValue = false;
    } else if (inValue) {
      value += char;
    } else {
      key += char;
    }
  }
  return fields;
}
