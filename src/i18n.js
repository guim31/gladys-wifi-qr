// -----------------------------------------------------------------------------
// Every text the container produces, in the four languages of the Gladys
// interface. German says "du", Spanish "usted". Wording of the Gladys front
// (front/src/config/i18n) where it has one.
// -----------------------------------------------------------------------------

/** Why a network gets no QR code (src/wifi.js networkProblem). */
export const PROBLEM_TEXT = {
  en: {
    ssid_too_long: 'the network name is longer than 32 bytes',
    password_missing: 'the password is empty',
    password_length: 'a WPA password holds 8 to 63 characters',
    wep_length: 'a WEP key holds 5 or 13 characters (10 or 26 hex digits)',
  },
  fr: {
    ssid_too_long: 'le nom du réseau dépasse 32 octets',
    password_missing: 'le mot de passe est vide',
    password_length: 'un mot de passe WPA compte de 8 à 63 caractères',
    wep_length: 'une clé WEP compte 5 ou 13 caractères (10 ou 26 en hexadécimal)',
  },
  de: {
    ssid_too_long: 'der Netzwerkname ist länger als 32 Byte',
    password_missing: 'das Passwort ist leer',
    password_length: 'ein WPA-Passwort hat 8 bis 63 Zeichen',
    wep_length: 'ein WEP-Schlüssel hat 5 oder 13 Zeichen (10 oder 26 hexadezimal)',
  },
  es: {
    ssid_too_long: 'el nombre de la red supera los 32 bytes',
    password_missing: 'la contraseña está vacía',
    password_length: 'una contraseña WPA tiene de 8 a 63 caracteres',
    wep_length: 'una clave WEP tiene 5 o 13 caracteres (10 o 26 hexadecimales)',
  },
};

/** The widget texts. */
export const WIDGET_TEXT = {
  en: {
    password: (password) => `Password: ${password}`,
    open: 'Open network, no password',
    notConfigured: (slot) =>
      `Network ${slot} is not set up: fill in its name on the integration page.`,
    problem: (slot, problem) => `No QR code for network ${slot}: ${problem}.`,
    alt: 'QR code to join the Wi-Fi network',
  },
  fr: {
    password: (password) => `Mot de passe : ${password}`,
    open: 'Réseau ouvert, sans mot de passe',
    notConfigured: (slot) =>
      `Le réseau ${slot} n'est pas configuré : renseignez son nom sur la page de l'intégration.`,
    problem: (slot, problem) => `Pas de QR code pour le réseau ${slot} : ${problem}.`,
    alt: 'QR code pour rejoindre le réseau Wi-Fi',
  },
  de: {
    password: (password) => `Passwort: ${password}`,
    open: 'Offenes Netzwerk, ohne Passwort',
    notConfigured: (slot) =>
      `Netzwerk ${slot} ist nicht eingerichtet: Trag seinen Namen auf der Seite der Integration ein.`,
    problem: (slot, problem) => `Kein QR-Code für Netzwerk ${slot}: ${problem}.`,
    alt: 'QR-Code zum Verbinden mit dem WLAN',
  },
  es: {
    password: (password) => `Contraseña: ${password}`,
    open: 'Red abierta, sin contraseña',
    notConfigured: (slot) =>
      `La red ${slot} no está configurada: indique su nombre en la página de la integración.`,
    problem: (slot, problem) => `No hay código QR para la red ${slot}: ${problem}.`,
    alt: 'Código QR para conectarse a la red Wi-Fi',
  },
};

/** The messages of the integration status (setConnectionStatus). */
export const STATUS_TEXT = {
  en: {
    noNetwork: 'No network set up yet: fill in at least one network name.',
    problem: (slot, problem) => `Network ${slot}: ${problem}.`,
  },
  fr: {
    noNetwork: 'Aucun réseau configuré : renseignez au moins un nom de réseau.',
    problem: (slot, problem) => `Réseau ${slot} : ${problem}.`,
  },
  de: {
    noNetwork: 'Noch kein Netzwerk eingerichtet: Trag mindestens einen Netzwerknamen ein.',
    problem: (slot, problem) => `Netzwerk ${slot}: ${problem}.`,
  },
  es: {
    noNetwork: 'Aún no hay ninguna red configurada: indique al menos un nombre de red.',
    problem: (slot, problem) => `Red ${slot}: ${problem}.`,
  },
};

/** The same text built in every language: { en, fr, de, es }. */
export function inEveryLanguage(build) {
  return Object.fromEntries(
    Object.keys(WIDGET_TEXT).map((language) => [language, build(language)]),
  );
}
