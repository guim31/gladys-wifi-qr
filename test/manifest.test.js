// -----------------------------------------------------------------------------
// Consistency checks between `gladys-assistant-integration.json` and the code.
// The manifest is validated by the store indexer, but nothing there can know
// which handlers the code actually registers — these tests keep both in sync.
// -----------------------------------------------------------------------------

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SCENE_ACTION, WIDGET_KEY } from '../src/app.js';
import { DEFAULT_CONFIG, NO_MANIFEST_DEFAULT, SECURITY, SLOTS } from '../src/config.js';
import { createWorld } from './helpers/world.js';

const manifest = JSON.parse(
  await readFile(new URL('../gladys-assistant-integration.json', import.meta.url), 'utf8'),
);
const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));

const allFields = [
  ...manifest.config_schema,
  ...manifest.scene_actions.flatMap((item) => item.fields ?? []),
  ...manifest.widgets.flatMap((widget) => widget.settings ?? []),
];

const registered = await createWorld({ connect: false });
const handlerKeys = (prefix) =>
  Object.keys(registered.gladys.handlers)
    .filter((key) => key.startsWith(prefix))
    .map((key) => key.slice(prefix.length));
const keysOf = (list) => (list ?? []).map((entry) => entry.key);
const options = (field) => field.options.map((option) => option.value);

test('identity: name, type, image, cover, transports, category', () => {
  assert.equal(manifest.name, 'Wi-Fi QR Code');
  // No device: a widget and a scene action.
  assert.equal(manifest.type, 'provider');
  assert.match(manifest.docker_image, /^ghcr\.io\/guim31\/gladys-wifi-qr:/);
  assert.equal(
    manifest.cover_image,
    'https://raw.githubusercontent.com/guim31/gladys-wifi-qr/main/cover.png',
  );
  // Everything is computed in the container, nothing leaves the network.
  assert.deepEqual(manifest.transports, ['local']);
  assert.deepEqual(manifest.categories, ['network']);
});

test('widget images exist since Gladys 5.2.0', () => {
  assert.equal(manifest.gladys_version, '>=5.2.0');
});

test('the widget and the scene action have handlers, and nothing else is registered', () => {
  assert.deepEqual(keysOf(manifest.widgets), [WIDGET_KEY]);
  assert.deepEqual(handlerKeys('widget:'), [WIDGET_KEY]);
  assert.deepEqual(keysOf(manifest.scene_actions), [SCENE_ACTION]);
  assert.deepEqual(handlerKeys('sceneAction:'), [SCENE_ACTION]);
  assert.equal(manifest.actions, undefined);
  assert.equal(manifest.scene_triggers, undefined);
});

test('the widget and the scene action name the same network slots as the configuration', () => {
  const [widget] = manifest.widgets;
  assert.deepEqual(keysOf(widget.settings), ['network', 'show_ssid', 'show_password']);
  assert.deepEqual(options(widget.settings[0]), SLOTS);
  const [action] = manifest.scene_actions;
  assert.deepEqual(keysOf(action.fields), ['network', 'password']);
  assert.deepEqual(options(action.fields[0]), SLOTS);
  // A secret field cannot be filled in a scene card (Gladys #3154).
  assert.equal(action.fields[1].type, 'string');
});

test('config_schema defaults and options stay consistent with the code', () => {
  const fields = manifest.config_schema.filter((entry) => entry.type !== 'section');
  assert.deepEqual(keysOf(fields).sort(), Object.keys(DEFAULT_CONFIG).sort());
  for (const entry of fields) {
    if (NO_MANIFEST_DEFAULT.includes(entry.key)) {
      assert.equal(entry.type, 'secret', entry.key);
      assert.equal(entry.default, undefined, entry.key);
    } else {
      assert.deepEqual(entry.default, DEFAULT_CONFIG[entry.key], entry.key);
    }
    if (entry.type === 'select') {
      assert.deepEqual(options(entry), Object.keys(SECURITY), entry.key);
    }
  }
});

test('the passwords are secret fields, and no setting of the dashboard is', () => {
  const secrets = manifest.config_schema.filter((entry) => entry.type === 'secret');
  assert.deepEqual(keysOf(secrets), NO_MANIFEST_DEFAULT);
  assert.ok(manifest.widgets[0].settings.every((entry) => entry.type !== 'secret'));
});

test('section fields are purely presentational', () => {
  for (const section of manifest.config_schema.filter((entry) => entry.type === 'section')) {
    assert.equal(section.required, undefined);
    assert.equal(section.default, undefined);
    for (const link of section.links ?? []) {
      assert.match(link.url, /^https:\/\//);
    }
  }
});

test('no number field (the form has no step)', () => {
  assert.ok(allFields.every((entry) => entry.type !== 'number'));
});

test('the manifest version is the package version, and the image is tagged with it', () => {
  assert.equal(manifest.version, pkg.version);
  assert.ok(manifest.docker_image.endsWith(`:${manifest.version}`));
});

test('the catalog description holds 10 to 100 characters per language', () => {
  for (const [lang, text] of Object.entries(manifest.description)) {
    assert.ok(text.length >= 10 && text.length <= 100, `description.${lang}: ${text.length}`);
  }
});

test('qrcode is a runtime dependency (the image installs no devDependency)', () => {
  assert.ok(pkg.dependencies.qrcode);
  assert.equal(pkg.devDependencies.qrcode, undefined);
});
