// -----------------------------------------------------------------------------
// Registers every SDK handler on a GladysIntegration (or the SDK's fake Gladys
// in the tests), so index.js stays a few lines and the tests drive the very
// same wiring.
//
// A provider integration: no device, one dashboard widget (the QR code of a
// network, its name and its password) and one scene action (change the
// password of a network, e.g. from a variable).
// -----------------------------------------------------------------------------

import { createHmac } from 'node:crypto';
import { createLogger } from '@gladysassistant/integration-sdk';
import QRCode from 'qrcode';
import { SLOTS, normalizeConfig } from './config.js';
import { PROBLEM_TEXT, STATUS_TEXT, WIDGET_TEXT, inEveryLanguage } from './i18n.js';
import { loadImageSecret } from './store.js';
import { networkProblem, wifiPayload } from './wifi.js';

const logger = createLogger({ name: 'wifi-qr' });

export const WIDGET_KEY = 'wifi_qr';
export const SCENE_ACTION = 'set_password';
// The content only changes with the configuration, which nudges a refresh.
export const WIDGET_TTL_SECONDS = 600;
// 600 px: sharp in the widget's 16:9 frame (under 800 px wide), a few KB.
export const QR_WIDTH = 600;

const IMAGE_KEY = /^wifi-([1-9])-([0-9a-f]{16})$/;

/** The PNG of a QR code (Buffer). Error correction M: ~15 % may be damaged. */
export function renderQr(payload) {
  return QRCode.toBuffer(payload, {
    type: 'png',
    errorCorrectionLevel: 'M',
    margin: 4,
    width: QR_WIDTH,
    color: { dark: '#000000ff', light: '#ffffffff' },
  });
}

/**
 * @param {object} gladys GladysIntegration instance
 * @param {object} [options] test seams: secret (image key), dataDir
 */
export function registerHandlers(gladys, options = {}) {
  const secret = options.secret ?? loadImageSecret(options.dataDir);
  let raw = {};
  let networks = normalizeConfig(raw).networks;
  let lastStatus = null;
  // The last QR rendered per key: the image is asked right after the content.
  const images = new Map();

  const imageKey = (network) =>
    `wifi-${network.slot}-${createHmac('sha256', secret).update(wifiPayload(network)).digest('hex').slice(0, 16)}`;

  const applyConfig = async (config) => {
    raw = { ...(config ?? {}) };
    networks = normalizeConfig(raw).networks;
    // A cached image of an old password must never be served again.
    images.clear();
    await publishStatus();
  };

  const publishStatus = async () => {
    const configured = networks.filter((network) => network.configured);
    const problems = configured
      .map((network) => ({ network, problem: networkProblem(network) }))
      .filter(({ problem }) => problem);
    let status;
    if (configured.length === 0) {
      status = [false, inEveryLanguage((language) => STATUS_TEXT[language].noNetwork)];
    } else if (problems.length > 0) {
      status = [
        false,
        inEveryLanguage((language) =>
          problems
            .map(({ network, problem }) =>
              STATUS_TEXT[language].problem(network.slot, PROBLEM_TEXT[language][problem]),
            )
            .join(' '),
        ),
      ];
    } else {
      status = [true];
    }
    const signature = JSON.stringify(status);
    if (signature === lastStatus) {
      return;
    }
    lastStatus = signature;
    try {
      await gladys.setConnectionStatus(...status);
    } catch (err) {
      lastStatus = null;
      logger.warn(`Cannot publish the integration status: ${err.message}`);
    }
  };

  const refreshWidget = async () => {
    try {
      await gladys.requestWidgetRefresh(WIDGET_KEY);
    } catch (err) {
      // Rate-limited (1 per 10 s) or disconnected: the TTL catches up.
      logger.debug(`Widget refresh not sent: ${err.message}`);
    }
  };

  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });
  const whenReady =
    (fn) =>
    async (...args) => {
      await ready;
      return fn(...args);
    };

  gladys.on('connected', async () => {
    try {
      await applyConfig(await gladys.getConfig());
    } catch (err) {
      logger.error(`Cannot read the configuration: ${err.message}`);
    } finally {
      resolveReady();
    }
  });

  // Configuration updates and scene actions run one at a time: a scene's
  // password must not be overwritten by an update read before it.
  let queue = Promise.resolve();
  const serial =
    (fn) =>
    (...args) => {
      const run = queue.then(() => fn(...args));
      queue = run.catch(() => {});
      return run;
    };

  gladys.onConfigUpdated(
    whenReady(
      serial(async (config) => {
        await applyConfig(config);
        logger.info('Configuration updated');
        await refreshWidget();
      }),
    ),
  );

  gladys.onWidgetGet(
    WIDGET_KEY,
    whenReady(async ({ settings = {}, language } = {}) => {
      const text = WIDGET_TEXT[language] ?? WIDGET_TEXT.en;
      const slot = SLOTS.includes(String(settings.network)) ? String(settings.network) : SLOTS[0];
      const network = networks.find((entry) => entry.slot === slot);
      const content = (components) => ({ ttl_seconds: WIDGET_TTL_SECONDS, components });
      if (!network.configured) {
        return content([{ type: 'text', variant: 'body', text: text.notConfigured(slot) }]);
      }
      const problem = networkProblem(network);
      if (problem) {
        const reason = (PROBLEM_TEXT[language] ?? PROBLEM_TEXT.en)[problem];
        return content([{ type: 'text', variant: 'body', text: text.problem(slot, reason) }]);
      }
      const components = [];
      if (settings.show_ssid !== false) {
        components.push({ type: 'text', variant: 'heading', text: network.ssid });
      }
      components.push({ type: 'image', key: imageKey(network), alt: text.alt, fit: 'contain' });
      if (settings.show_password !== false) {
        components.push({
          type: 'text',
          variant: 'body',
          text: network.security === 'none' ? text.open : text.password(network.password),
        });
      }
      return content(components);
    }),
  );

  gladys.onWidgetGetImage(
    whenReady(async (key) => {
      const [, slot] = IMAGE_KEY.exec(key) ?? [];
      // Only the key of the current settings: an old key would serve an old password.
      const isCurrent = () => {
        const network = networks.find((entry) => entry.slot === slot);
        return network?.configured && !networkProblem(network) && imageKey(network) === key;
      };
      if (!isCurrent()) {
        throw new Error('Unknown or outdated image key');
      }
      if (images.has(key)) {
        return images.get(key);
      }
      const network = networks.find((entry) => entry.slot === slot);
      const png = (await renderQr(wifiPayload(network))).toString('base64');
      // The settings may have changed during the rendering: never cache an old password.
      if (!isCurrent()) {
        throw new Error('Unknown or outdated image key');
      }
      for (const cached of images.keys()) {
        if (cached.startsWith(`wifi-${slot}-`)) {
          images.delete(cached);
        }
      }
      images.set(key, png);
      return png;
    }),
  );

  gladys.onSceneAction(
    SCENE_ACTION,
    whenReady(
      serial(async (fields = {}) => {
        const slot = String(fields.network ?? '');
        // A variable read from a web page or a file often ends with a line break.
        const password = String(fields.password ?? '').replace(/^[\r\n]+|[\r\n]+$/g, '');
        const network = networks.find((entry) => entry.slot === slot);
        if (!network) {
          throw new Error(`Unknown network "${slot}"`);
        }
        if (!network.configured) {
          throw new Error(`Network ${slot} is not set up`);
        }
        if (network.security === 'none') {
          throw new Error(`Network ${slot} is open: it has no password`);
        }
        const problem = networkProblem({ ...network, password });
        if (problem) {
          throw new Error(`Password refused for network ${slot}: ${PROBLEM_TEXT.en[problem]}`);
        }
        if (password === network.password) {
          return undefined;
        }
        const key = `password_${slot}`;
        await gladys.setConfig({ [key]: password });
        await applyConfig({ ...raw, [key]: password });
        logger.info(`Password of network ${slot} changed by a scene`);
        await refreshWidget();
        return undefined;
      }),
    ),
  );

  return {
    ready,
    networks: () => networks,
    imageKey,
    stop: async () => {},
  };
}
