// -----------------------------------------------------------------------------
// The integration against the SDK's fake Gladys: the widget content and its
// image (read back as a QR code), the settings that hide a block, the scene
// action that changes a password, the integration status, and quiet logs that
// never carry a password.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { validateWidgetContent, validateWidgetImage } from '@gladysassistant/integration-sdk';
import { SCENE_ACTION, WIDGET_KEY } from '../src/app.js';
import { loadImageSecret } from '../src/store.js';
import { createWorld, parseWifi, readQr } from './helpers/world.js';

const GUESTS = {
  ssid_1: 'Invités; "Maison"',
  security_1: 'wpa',
  password_1: 'Bienvenue:à,tous\\',
  hidden_1: false,
  ssid_2: 'Atelier',
  security_2: 'none',
};

const widget = async (world, settings = {}, language = 'fr') => {
  const ack = await world.gladys.fake.widgetGet(WIDGET_KEY, { settings, language });
  assert.equal(ack.success, true, ack.error);
  return ack.data.content;
};
const image = async (world, key) => {
  const ack = await world.gladys.fake.widgetGetImage(key);
  assert.equal(ack.success, true, ack.error);
  return ack.data.image;
};
const byType = (content, type) => content.components.filter((c) => c.type === type);

/** Captures the lines of the SDK logger (console.log / console.error). */
function captureLogs(t) {
  const previous = process.env.LOG_LEVEL;
  delete process.env.LOG_LEVEL; // the default level: info
  t.after(() => {
    if (previous !== undefined) {
      process.env.LOG_LEVEL = previous;
    }
  });
  const lines = [];
  const keep = (...args) => lines.push(args.map(String).join(' '));
  t.mock.method(console, 'log', keep);
  t.mock.method(console, 'error', keep);
  t.mock.method(console, 'warn', keep);
  return lines;
}

test('the widget shows the name, the QR code and the password, in the vocabulary', async () => {
  const world = await createWorld({ config: GUESTS });
  const content = await widget(world, { network: '1', show_ssid: true, show_password: true });
  assert.deepEqual(validateWidgetContent(content), []);
  assert.deepEqual(
    content.components.map((c) => c.type),
    ['text', 'image', 'text'],
  );
  assert.equal(content.components[0].text, 'Invités; "Maison"');
  assert.equal(content.components[2].text, 'Mot de passe : Bienvenue:à,tous\\');
  const [qr] = byType(content, 'image');
  assert.match(qr.key, /^wifi-1-[0-9a-f]{16}$/);
  assert.equal(qr.fit, 'contain');
  // The key reveals nothing of the password: an HMAC under the /data key.
  assert.ok(!qr.key.includes('Bienvenue'));

  const png = await image(world, qr.key);
  assert.deepEqual(validateWidgetImage(png), []);
  assert.equal(
    readQr(png),
    String.raw`WIFI:T:WPA;S:Invités\; \"Maison\";P:Bienvenue\:à\,tous\\;H:false;;`,
  );
  assert.deepEqual(parseWifi(readQr(png)), {
    T: 'WPA',
    S: GUESTS.ssid_1,
    P: GUESTS.password_1,
    H: 'false',
  });
  // Nothing published as a device: a provider integration.
  assert.deepEqual(world.gladys.fake.discoveredDevices, []);
});

test('the settings hide the name and the password; the defaults show them', async () => {
  const world = await createWorld({ config: GUESTS });
  const hidden = await widget(world, { network: '1', show_ssid: false, show_password: false });
  assert.deepEqual(
    hidden.components.map((c) => c.type),
    ['image'],
  );
  const defaults = await widget(world, {});
  assert.equal(byType(defaults, 'text').length, 2);
  assert.equal(byType(defaults, 'image')[0].key, byType(hidden, 'image')[0].key);
});

test('an open network says so, and its QR code carries no password', async () => {
  const world = await createWorld({ config: GUESTS });
  const content = await widget(world, { network: '2' }, 'de');
  assert.equal(content.components[2].text, 'Offenes Netzwerk, ohne Passwort');
  const png = await image(world, byType(content, 'image')[0].key);
  assert.equal(readQr(png), 'WIFI:T:nopass;S:Atelier;H:false;;');
});

test('a network not set up or invalid shows why, without an image', async () => {
  const world = await createWorld({ config: { ...GUESTS, password_1: 'short' } });
  const empty = await widget(world, { network: '3' }, 'en');
  assert.deepEqual(empty.components, [
    {
      type: 'text',
      variant: 'body',
      text: 'Network 3 is not set up: fill in its name on the integration page.',
    },
  ]);
  const invalid = await widget(world, { network: '1' }, 'es');
  assert.deepEqual(byType(invalid, 'image'), []);
  assert.match(invalid.components[0].text, /8 a 63 caracteres/);
  assert.deepEqual(validateWidgetContent(invalid), []);
});

test('the integration status names the network to fix, in four languages', async () => {
  const world = await createWorld({ config: {} });
  assert.equal(world.gladys.fake.connectionStatus.connected, false);
  assert.deepEqual(Object.keys(world.gladys.fake.connectionStatus.message).sort(), [
    'de',
    'en',
    'es',
    'fr',
  ]);

  await world.gladys.fake.configUpdated({ ...GUESTS, ssid_3: 'x'.repeat(33) });
  assert.deepEqual(world.gladys.fake.connectionStatus, {
    connected: false,
    message: {
      en: 'Network 3: the network name is longer than 32 bytes.',
      fr: 'Réseau 3 : le nom du réseau dépasse 32 octets.',
      de: 'Netzwerk 3: der Netzwerkname ist länger als 32 Byte.',
      es: 'Red 3: el nombre de la red supera los 32 bytes.',
    },
  });
  await world.gladys.fake.configUpdated(GUESTS);
  assert.deepEqual(world.gladys.fake.connectionStatus, { connected: true });
  assert.deepEqual(world.gladys.fake.widgetRefreshes, [WIDGET_KEY, WIDGET_KEY]);
  // Published on change only.
  const count = world.gladys.fake.connectionStatuses.length;
  await world.gladys.fake.configUpdated(GUESTS);
  assert.equal(world.gladys.fake.connectionStatuses.length, count);
});

test('the scene action saves the new password, changes the image key, and the old key dies', async () => {
  const world = await createWorld({ config: GUESTS });
  const before = byType(await widget(world, { network: '1' }), 'image')[0].key;
  await image(world, before);

  const ack = await world.gladys.fake.sceneAction(SCENE_ACTION, {
    network: '1',
    password: 'Nouveau-mot;de:passe-2026\n',
  });
  assert.equal(ack.success, true, ack.error);
  assert.equal(world.gladys.fake.config.password_1, 'Nouveau-mot;de:passe-2026');
  assert.deepEqual(world.gladys.fake.widgetRefreshes, [WIDGET_KEY]);

  const content = await widget(world, { network: '1' });
  const after = byType(content, 'image')[0].key;
  assert.notEqual(after, before);
  assert.equal(content.components[2].text, 'Mot de passe : Nouveau-mot;de:passe-2026');
  assert.equal(parseWifi(readQr(await image(world, after))).P, 'Nouveau-mot;de:passe-2026');
  const stale = await world.gladys.fake.widgetGetImage(before);
  assert.equal(stale.success, false);

  // The same password again: nothing written.
  const writes = world.gladys.fake.requests.filter((r) => r.path === '/config').length;
  await world.gladys.fake.sceneAction(SCENE_ACTION, {
    network: '1',
    password: 'Nouveau-mot;de:passe-2026',
  });
  assert.equal(world.gladys.fake.requests.filter((r) => r.path === '/config').length, writes);
});

test('the scene action refuses what would make a QR code that fails', async () => {
  const world = await createWorld({ config: GUESTS });
  const refused = async (fields) => {
    const ack = await world.gladys.fake.sceneAction(SCENE_ACTION, fields);
    assert.equal(ack.success, false, JSON.stringify(fields));
    return ack.error;
  };
  assert.match(await refused({ network: '1', password: 'short' }), /8 to 63/);
  assert.match(await refused({ network: '1', password: '' }), /empty/);
  assert.match(await refused({ network: '2', password: 'whatever-1' }), /open/);
  assert.match(await refused({ network: '3', password: 'whatever-1' }), /not set up/);
  assert.match(await refused({ network: '9', password: 'whatever-1' }), /Unknown/);
  assert.equal(world.gladys.fake.config.password_1, GUESTS.password_1);
});

test('the logs stay quiet and never carry a password', async (t) => {
  const lines = captureLogs(t);
  const world = await createWorld({ config: GUESTS });
  const key = byType(await widget(world, { network: '1' }), 'image')[0].key;
  await image(world, key);
  assert.deepEqual(lines, [], 'nothing at info for a normal widget display');
  await world.gladys.fake.sceneAction(SCENE_ACTION, { network: '1', password: 'Secret-42-xyz' });
  await world.gladys.fake.configUpdated({ ...GUESTS, password_1: 'Other-secret-99' });
  await world.gladys.fake.sceneAction(SCENE_ACTION, { network: '1', password: 'short' });
  const all = lines.join('\n');
  for (const secret of [GUESTS.password_1, 'Secret-42-xyz', 'Other-secret-99', 'short']) {
    assert.ok(!all.includes(secret), `"${secret}" in the logs`);
  }
  assert.ok(all.includes('Password of network 1 changed by a scene'));
});

test('the image key is kept in /data, private, and survives a restart', (t) => {
  const dir = mkdtempSync(path.join(tmpdir(), 'wifi-qr-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const first = loadImageSecret(dir);
  assert.match(first, /^[0-9a-f]{64}$/);
  assert.equal(loadImageSecret(dir), first);
  const file = path.join(dir, 'image-key.secret');
  assert.equal(readFileSync(file, 'utf8'), first);
  assert.equal(statSync(file).mode & 0o077, 0);
});

test('without a writable /data the key lives in memory', (t) => {
  t.mock.method(console, 'log', () => {});
  t.mock.method(console, 'error', () => {});
  const dir = mkdtempSync(path.join(tmpdir(), 'wifi-qr-'));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  // A directory under a regular file: neither readable nor creatable.
  writeFileSync(path.join(dir, 'file'), '');
  const secret = loadImageSecret(path.join(dir, 'file', 'data'));
  assert.match(secret, /^[0-9a-f]{64}$/);
});
