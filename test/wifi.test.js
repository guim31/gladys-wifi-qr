// -----------------------------------------------------------------------------
// The text of the QR code and its escaping, checked by reading back the PNG
// the integration renders (jsQR), then parsing it like a phone does.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { renderQr } from '../src/app.js';
import { escapeWifi, networkProblem, wifiPayload } from '../src/wifi.js';
import { parseWifi, readQr } from './helpers/world.js';

const cases = JSON.parse(
  await readFile(new URL('./fixtures/networks.json', import.meta.url), 'utf8'),
);

test('the five special characters are escaped, and only them', () => {
  assert.equal(escapeWifi(String.raw`a\b;c,d:e"f`), String.raw`a\\b\;c\,d\:e\"f`);
  assert.equal(escapeWifi("L'été à 100 % !"), "L'été à 100 % !");
});

test('the exact text of each fixture network', () => {
  for (const { network, payload } of cases) {
    assert.equal(wifiPayload(network), payload, network.ssid);
  }
});

test('every QR code rendered reads back as the exact text, then as the typed values', async () => {
  for (const { network, payload } of cases) {
    const png = await renderQr(wifiPayload(network));
    const text = readQr(png);
    assert.equal(text, payload, network.ssid);
    const fields = parseWifi(text);
    assert.equal(fields.S, network.ssid);
    assert.equal(fields.H, network.hidden ? 'true' : 'false');
    if (network.security === 'none') {
      assert.equal(fields.T, 'nopass');
      assert.equal(fields.P, undefined);
    } else {
      assert.equal(fields.P, network.password);
    }
  }
});

test('a 63-byte password full of special characters still fits and reads back', async () => {
  const password = ';:,"\\'.repeat(11) + 'éèà'; // 55 + 6 bytes
  const network = { ssid: 'Ünïcödé;"SSID"', security: 'wpa', password, hidden: true };
  assert.equal(networkProblem(network), null);
  const fields = parseWifi(readQr(await renderQr(wifiPayload(network))));
  assert.deepEqual(fields, { T: 'WPA', S: network.ssid, P: password, H: 'true' });
});

test('the bounds of 802.11: 32-byte SSID, 8 to 63 characters or 64 hex digits for WPA', () => {
  const base = { ssid: 'Guests', security: 'wpa', password: 'correct horse', hidden: false };
  assert.equal(networkProblem(base), null);
  assert.equal(networkProblem({ ...base, ssid: 'é'.repeat(16) }), null);
  assert.equal(networkProblem({ ...base, ssid: 'é'.repeat(17) }), 'ssid_too_long');
  assert.equal(networkProblem({ ...base, password: '' }), 'password_missing');
  assert.equal(networkProblem({ ...base, password: '1234567' }), 'password_length');
  assert.equal(networkProblem({ ...base, password: 'a'.repeat(63) }), null);
  assert.equal(networkProblem({ ...base, password: 'a'.repeat(64) }), null, 'raw key');
  assert.equal(networkProblem({ ...base, password: 'g'.repeat(64) }), 'password_length');
  assert.equal(networkProblem({ ...base, security: 'sae', password: 'short' }), 'password_length');
  assert.equal(networkProblem({ ...base, security: 'wep', password: '12345' }), null);
  assert.equal(
    networkProblem({ ...base, security: 'wep', password: '0123456789abcdef0123456789' }),
    null,
  );
  assert.equal(networkProblem({ ...base, security: 'wep', password: '123456' }), 'wep_length');
  assert.equal(networkProblem({ ...base, security: 'none', password: '' }), null);
});
