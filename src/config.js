// -----------------------------------------------------------------------------
// The configuration: up to three Wi-Fi networks, each a fixed group of fields
// (`ssid_1`, `security_1`, `password_1`, `hidden_1`...). The manifest form has
// no list type, so the slots are numbered; their keys are forever.
// -----------------------------------------------------------------------------

export const LANGUAGES = ['en', 'fr', 'de', 'es'];

/** The network slots, as the widget setting and the scene action name them. */
export const SLOTS = ['1', '2', '3'];

/** Security values of the form → the `T:` field of the Wi-Fi QR code. */
export const SECURITY = {
  wpa: 'WPA', // WPA, WPA2 and WPA2/WPA3 transition: what nearly every router uses
  sae: 'SAE', // WPA3 only
  wep: 'WEP',
  none: 'nopass',
};

export const DEFAULT_CONFIG = Object.fromEntries(
  SLOTS.flatMap((slot) => [
    [`ssid_${slot}`, ''],
    [`security_${slot}`, 'wpa'],
    [`password_${slot}`, ''],
    [`hidden_${slot}`, false],
  ]),
);
// A secret field takes no default in the manifest: it starts empty.
export const NO_MANIFEST_DEFAULT = SLOTS.map((slot) => `password_${slot}`);

const text = (value) => (typeof value === 'string' ? value : '');

/**
 * The configuration Gladys sent, made complete: one entry per slot,
 * `configured: false` when its network name is empty.
 * @param {object} raw gladys.config
 * @returns {{ networks: object[] }}
 */
export function normalizeConfig(raw = {}) {
  const config = raw ?? {};
  return {
    networks: SLOTS.map((slot) => {
      const ssid = text(config[`ssid_${slot}`]);
      const security = Object.hasOwn(SECURITY, config[`security_${slot}`])
        ? config[`security_${slot}`]
        : DEFAULT_CONFIG[`security_${slot}`];
      return {
        slot,
        // An SSID may legitimately start or end with a space: keep it as typed,
        // but a name made of spaces only is no name.
        ssid,
        configured: ssid.trim() !== '',
        security,
        password: security === 'none' ? '' : text(config[`password_${slot}`]),
        hidden: config[`hidden_${slot}`] === true || config[`hidden_${slot}`] === 'true',
      };
    }),
  };
}
