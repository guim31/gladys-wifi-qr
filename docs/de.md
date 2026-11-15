# WLAN-QR-Code

Zeig den QR-Code deines Gäste-WLANs auf einem Gladys-Dashboard: Ein Gast
richtet die Handykamera darauf und verbindet sich, ohne ein Passwort zu tippen.
Bis zu drei Netzwerke, ein Widget und eine Szenenaktion, um das angezeigte
Passwort zu ändern.

Alles bleibt in deinem Gladys: kein Konto, kein Internetzugang, keine Daten,
die irgendwohin gesendet werden.

> Die QR-Codes werden in den automatischen Tests mit einem QR-Decoder
> zurückgelesen. Mit allen Handys gescannt wurden sie noch nicht: Deine
> Rückmeldungen sind im Forum oder in einem GitHub-Issue willkommen.

## Voraussetzungen

- Gladys Assistant 5.2.0 oder neuer (Widget-Bilder).
- Name (SSID), Sicherheit und Passwort des Netzwerks, das du teilen willst.

## Konfiguration

Trag auf der Seite der Integration bis zu drei Netzwerke ein. Lass den Namen
eines Netzwerks leer, um es nicht zu nutzen.

### Netzwerkname, Sicherheit, Passwort

- **Netzwerkname (SSID)**: genau wie die Handys ihn anzeigen. Groß- und
  Kleinschreibung, Leerzeichen und Akzente zählen. Höchstens 32 Byte.
- **Sicherheit**: **WPA / WPA2** passt zu fast allen Routern, gemischter
  WPA2/WPA3-Modus inklusive. Wähle **Nur WPA3** nur, wenn der Router nichts
  anderes akzeptiert: Manche älteren Handys lesen es nicht. **Keine** ist für
  ein offenes Netzwerk.
- **Passwort**: 8 bis 63 Zeichen bei WPA. Gladys speichert es als Geheimnis,
  und es steht nie in den Protokollen.
- **Verstecktes Netzwerk**: Aktiviere es, wenn der Router den Namen nicht
  sendet.

Die Sonderzeichen `\ ; , : "` werden im QR-Code maskiert, wie das Format es
verlangt: Ein Passwort wie `p@ss;word:2026` funktioniert.

### Status der Integration

Die Seite der Integration zeigt einen Fehler, wenn kein Netzwerk eingerichtet
ist oder wenn ein Netzwerk keinen funktionierenden QR-Code ergeben kann
(Passwort zu kurz, Name zu lang), und nennt das zu korrigierende Netzwerk.

## Dashboard-Widget

Füge das Widget **WLAN-QR-Code** einem Dashboard hinzu und wähle sein
Netzwerk. Es zeigt:

- den Netzwerknamen (Einstellung **Netzwerknamen anzeigen**);
- den QR-Code;
- das Passwort im Klartext oder „Offenes Netzwerk“ (Einstellung **Passwort
  anzeigen**).

Schalte das Passwort aus, um nur den QR-Code zu zeigen. Der QR-Code enthält
immer das Passwort: So verbindet sich das Handy.

## Szenenaktion „Angezeigtes WLAN-Passwort ändern“

Aktualisiert das Passwort eines Netzwerks, gespeichert in der Konfiguration:
QR-Code und Widget folgen in wenigen Sekunden (höchstens einigen Minuten). Das Passwort kann aus einer Szenenvariablen
kommen, zum Beispiel wenn eine andere Integration das Gästepasswort wechselt.

Diese Aktion ändert **nicht** das Passwort des Routers: Geändert wird nur, was
Gladys zeigt. Ein Passwort, das das Netzwerk ablehnen würde (zu kurz für WPA,
offenes Netzwerk, nicht eingerichtetes Netzwerk), lässt die Aktion scheitern,
und das bisherige Passwort bleibt.

## Szenenbeispiele

- Jeden Montag ändert eine Szene das Gästepasswort am Router (mit der
  Integration des Routers) und ruft dann „Angezeigtes WLAN-Passwort ändern“
  mit demselben Wert auf.
- Ein Tablet im Flur zeigt ein Dashboard nur mit dem Widget, Passwort
  ausgeblendet.

## Fehlerbehebung

- **Das Widget sagt, das Netzwerk sei nicht eingerichtet**: Trag seinen Namen
  auf der Seite der Integration ein und speichere.
- **Das Handy bietet keine Verbindung an**: Prüfe, ob Name und Passwort genau
  denen des Routers entsprechen (inklusive Groß- und Kleinschreibung). Bei
  **Nur WPA3** versuch **WPA / WPA2**: Die Handys handeln WPA3 dann selbst aus,
  wenn der Router es anbietet.
- **Kein QR-Code, stattdessen eine Meldung**: Die Meldung nennt den Grund
  (Passwort zu kurz, Name zu lang).

## Grenzen

- Das Dashboard zeigt das Passwort allen, die es sehen können, öffentliche
  Dashboards inklusive: Nutze ein Gästenetz.
- Höchstens drei Netzwerke.
- Die Integration liest und ändert den Router nicht: Das Passwort ist das hier
  eingetragene oder von einer Szene gesendete.
- Noch nicht mit allen Handymodellen gescannt (siehe Hinweis oben).

## Danksagungen

- QR-Codes erzeugt mit [node-qrcode](https://github.com/soldair/node-qrcode)
  (MIT).
- WLAN-QR-Format des Projekts [ZXing](https://github.com/zxing/zxing)
  (Apache 2.0).
- Nicht mit der Wi-Fi Alliance verbunden.
