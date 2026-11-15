# Wi-Fi QR Code for Gladys Assistant

An external integration for [Gladys Assistant](https://gladysassistant.com)
that shows the QR code of your guest Wi-Fi on a dashboard: a guest scans it
with the phone camera and joins the network, without typing the password.

- Up to three networks: name (SSID), WPA/WPA2, WPA3, WEP or open, password,
  hidden network.
- A dashboard widget: the QR code, the network name and the password, each
  text can be hidden.
- A scene action, "Change the Wi-Fi password shown", e.g. from a variable.
- 100 % local: no account, no internet access, nothing sent anywhere.

User documentation: [English](docs/en.md), [Français](docs/fr.md),
[Deutsch](docs/de.md), [Español](docs/es.md).

> The QR codes are checked by decoding them back (jsQR) in the tests, special
> characters and accents included. They have not been scanned with every phone
> yet: feedback welcome.

## Requirements

- Gladys Assistant 5.2.0 or later (images in dashboard widgets).

## Installation

In Gladys, open **Integrations → Install from GitHub** and enter
`https://github.com/guim31/gladys-wifi-qr`. Then fill in the networks on the
integration page and add the **Wi-Fi QR code** widget to a dashboard.

## How it works

The QR code holds the text phone cameras understand, from the
[ZXing](https://github.com/zxing/zxing/wiki/Barcode-Contents#wi-fi-network-config-android-ios-11)
format:

```
WIFI:T:WPA;S:<network name>;P:<password>;H:false;;
```

`\ ; , : "` are escaped with a backslash in the name and the password, which
are encoded in UTF-8. The PNG is rendered in the container by
[node-qrcode](https://github.com/soldair/node-qrcode) and served to the
dashboard through the widget image channel of the SDK. Its key is an HMAC of
the QR text under a random key kept in `/data`: it changes with the password,
so the core's image cache never serves an old one, and reveals nothing of it.

## Limits

- The widget shows the password, and the QR code contains it, to anyone who
  sees the dashboard (public dashboards included): share a guest network.
- The integration does not talk to the router: changing the password shown
  does not change the network.
- Three networks at most.

## Development

```bash
npm ci
npm run format:check && npm run lint && npm test
npx -y github:GladysAssistant/integration-store --skip-image-check .
```

The tests run against the SDK's fake Gladys and decode every QR code they
render. See [CLAUDE.md](CLAUDE.md) for the project rules.

## Credits

- [node-qrcode](https://github.com/soldair/node-qrcode) by Ryan Day (MIT),
  the QR code generator.
- [jsQR](https://github.com/cozmo/jsQR) (Apache 2.0), the decoder of the
  tests.
- The Wi-Fi QR format of the [ZXing](https://github.com/zxing/zxing) project
  (Apache 2.0).

Not affiliated with the Wi-Fi Alliance. "Wi-Fi" is a trademark of the Wi-Fi
Alliance.

## License

[Apache-2.0](LICENSE)
