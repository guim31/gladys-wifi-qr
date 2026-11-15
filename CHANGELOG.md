# Changelog

All notable changes to this integration are documented in this file. The format
follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
uses [semantic versioning](https://semver.org/).

Describe each change under `## [Unreleased]` as you make it. The Release
workflow moves that section under the version it ships, and the section becomes
the notes of the version's GitHub Release.

## [Unreleased]

## [1.0.0] - 2026-11-15

### Added

- Up to three Wi-Fi networks (name, WPA/WPA2, WPA3, WEP or open, password,
  hidden network), the password kept as a secret and never logged.
- Dashboard widget "Wi-Fi QR code": the QR code to join a network, its name
  and its password, each block can be hidden (Gladys 5.2.0 or later).
- Scene action "Change the Wi-Fi password shown", e.g. from a variable.
- The special characters `\ ; , : "` escaped in the QR code, accents
  included.
- The integration status names a network that cannot give a working QR code.
- Documentation in English, French, German and Spanish.

[Unreleased]: https://github.com/guim31/gladys-wifi-qr/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/guim31/gladys-wifi-qr/releases/tag/v1.0.0
