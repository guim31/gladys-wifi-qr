# QR code Wi-Fi

Affichez le QR code de votre Wi-Fi invités sur un tableau de bord de Gladys :
un invité pointe l'appareil photo de son téléphone dessus et rejoint le réseau,
sans taper de mot de passe. Jusqu'à trois réseaux, un widget, et une action de
scène pour changer le mot de passe affiché.

Tout se passe dans votre Gladys : ni compte, ni accès à Internet, aucune donnée
envoyée.

> Les QR codes sont vérifiés en les relisant avec un décodeur de QR code, dans
> les tests automatiques. Ils n'ont pas encore été scannés avec tous les
> téléphones : vos retours sont les bienvenus sur le forum ou dans une issue
> GitHub.

## Prérequis

- Gladys Assistant 5.2.0 ou plus récent (images des widgets).
- Le nom (SSID), la sécurité et le mot de passe du réseau à partager.

## Configuration

Sur la page de l'intégration, renseignez jusqu'à trois réseaux. Laissez vide le
nom d'un réseau pour ne pas l'utiliser.

### Nom du réseau, sécurité, mot de passe

- **Nom du réseau (SSID)** : exactement comme les téléphones l'affichent.
  Majuscules, espaces et accents comptent. 32 octets au plus.
- **Sécurité** : **WPA / WPA2** convient à presque tous les routeurs, mode mixte
  WPA2/WPA3 compris. Ne choisissez **WPA3 seul** que si le routeur n'accepte
  rien d'autre : certains téléphones anciens ne le lisent pas. **Aucune** est
  pour un réseau ouvert.
- **Mot de passe** : de 8 à 63 caractères en WPA. Gladys le stocke comme un
  secret, et il n'est jamais écrit dans les journaux.
- **Réseau masqué** : cochez si le routeur ne diffuse pas le nom.

Les caractères spéciaux `\ ; , : "` sont échappés dans le QR code comme le
format l'exige : un mot de passe comme `p@ss;word:2026` fonctionne.

### État de l'intégration

La page de l'intégration affiche une erreur quand aucun réseau n'est configuré,
ou quand un réseau ne peut pas donner un QR code qui fonctionne (mot de passe
trop court, nom trop long), et nomme le réseau à corriger.

## Widget du tableau de bord

Ajoutez le widget **QR code Wi-Fi** à un tableau de bord et choisissez son
réseau. Il affiche :

- le nom du réseau (réglage **Afficher le nom du réseau**) ;
- le QR code ;
- le mot de passe en clair, ou « Réseau ouvert » (réglage **Afficher le mot de
  passe**).

Désactivez le mot de passe pour n'afficher que le QR code. Le QR code contient
toujours le mot de passe : c'est ainsi que le téléphone rejoint le réseau.

## Action de scène « Changer le mot de passe Wi-Fi affiché »

Met à jour le mot de passe d'un réseau, enregistré dans la configuration : le
QR code et le widget suivent en quelques secondes (quelques minutes au plus). Le mot de passe peut venir d'une
variable de scène, par exemple quand une autre intégration change le mot de
passe invités.

Cette action ne change **pas** le mot de passe du routeur : elle ne change que
ce que Gladys affiche. Un mot de passe que le réseau refuserait (trop court en
WPA, réseau ouvert, réseau non configuré) fait échouer l'action, et l'ancien
mot de passe reste.

## Exemples de scènes

- Chaque lundi, une scène change le mot de passe invités sur le routeur (avec
  l'intégration du routeur), puis appelle « Changer le mot de passe Wi-Fi
  affiché » avec la même valeur.
- Une tablette dans l'entrée affiche un tableau de bord avec le widget seul,
  mot de passe masqué.

## Dépannage

- **Le widget dit que le réseau n'est pas configuré** : renseignez son nom sur
  la page de l'intégration, puis enregistrez.
- **Le téléphone ne propose pas de se connecter** : vérifiez que le nom et le
  mot de passe sont exactement ceux du routeur (majuscules comprises). En
  **WPA3 seul**, essayez **WPA / WPA2** : les téléphones négocient alors
  eux-mêmes le WPA3 quand le routeur le propose.
- **Pas de QR code, un message à la place** : le message donne la raison (mot
  de passe trop court, nom trop long).

## Limites

- Le tableau de bord montre le mot de passe à quiconque peut le voir, tableaux
  de bord publics compris : utilisez un réseau invités.
- Trois réseaux au plus.
- L'intégration ne lit ni ne modifie le routeur : le mot de passe est celui
  saisi ici ou envoyé par une scène.
- Pas encore scanné avec tous les modèles de téléphone (voir la note plus
  haut).

## Crédits

- QR codes générés par [node-qrcode](https://github.com/soldair/node-qrcode)
  (MIT).
- Format de QR code Wi-Fi du projet [ZXing](https://github.com/zxing/zxing)
  (Apache 2.0).
- Sans lien avec la Wi-Fi Alliance.
