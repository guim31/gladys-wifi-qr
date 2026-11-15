# Código QR Wi-Fi

Muestre el código QR de su Wi-Fi de invitados en un panel de Gladys: un
invitado apunta la cámara del teléfono y se conecta a la red, sin escribir la
contraseña. Hasta tres redes, un widget y una acción de escena para cambiar la
contraseña mostrada.

Todo ocurre dentro de su Gladys: sin cuenta, sin acceso a Internet, sin datos
enviados a ninguna parte.

> Los códigos QR se comprueban releyéndolos con un decodificador de QR, en las
> pruebas automáticas. Aún no se han escaneado con todos los teléfonos: sus
> comentarios son bienvenidos en el foro o en un issue de GitHub.

## Requisitos

- Gladys Assistant 5.2.0 o posterior (imágenes de los widgets).
- El nombre (SSID), la seguridad y la contraseña de la red que se va a
  compartir.

## Configuración

En la página de la integración, indique hasta tres redes. Deje vacío el nombre
de una red para no usarla.

### Nombre de la red, seguridad, contraseña

- **Nombre de la red (SSID)**: exactamente como lo muestran los teléfonos.
  Mayúsculas, espacios y acentos cuentan. 32 bytes como máximo.
- **Seguridad**: **WPA / WPA2** sirve para casi todos los routers, modo mixto
  WPA2/WPA3 incluido. Elija **Solo WPA3** solo si el router no acepta otra
  cosa: algunos teléfonos antiguos no lo leen. **Ninguna** es para una red
  abierta.
- **Contraseña**: de 8 a 63 caracteres en WPA. Gladys la guarda como secreto y
  nunca se escribe en los registros.
- **Red oculta**: márquelo si el router no difunde el nombre.

Los caracteres especiales `\ ; , : "` se escapan en el código QR como exige el
formato: una contraseña como `p@ss;word:2026` funciona.

### Estado de la integración

La página de la integración muestra un error cuando no hay ninguna red
configurada, o cuando una red no puede dar un código QR que funcione
(contraseña demasiado corta, nombre demasiado largo), e indica la red que hay
que corregir.

## Widget del panel

Añada el widget **Código QR Wi-Fi** a un panel y elija su red. Muestra:

- el nombre de la red (ajuste **Mostrar el nombre de la red**);
- el código QR;
- la contraseña en claro, o «Red abierta» (ajuste **Mostrar la contraseña**).

Desactive la contraseña para mostrar solo el código QR. El código QR siempre
contiene la contraseña: así se conecta el teléfono a la red.

## Acción de escena «Cambiar la contraseña Wi-Fi mostrada»

Actualiza la contraseña de una red, guardada en la configuración: el código QR
y el widget la siguen en unos segundos (unos minutos como máximo). La contraseña puede venir de una variable de
escena, por ejemplo cuando otra integración cambia la contraseña de invitados.

Esta acción **no** cambia la contraseña del router: solo cambia lo que Gladys
muestra. Una contraseña que la red rechazaría (demasiado corta en WPA, red
abierta, red no configurada) hace fallar la acción, y la contraseña anterior se
mantiene.

## Ejemplos de escenas

- Cada lunes, una escena cambia la contraseña de invitados en el router (con la
  integración del router) y luego llama a «Cambiar la contraseña Wi-Fi
  mostrada» con el mismo valor.
- Una tableta en la entrada muestra un panel solo con el widget, con la
  contraseña oculta.

## Solución de problemas

- **El widget dice que la red no está configurada**: indique su nombre en la
  página de la integración y guarde.
- **El teléfono no propone conectarse**: compruebe que el nombre y la
  contraseña son exactamente los del router (mayúsculas incluidas). Con **Solo
  WPA3**, pruebe **WPA / WPA2**: los teléfonos negocian entonces WPA3 por sí
  mismos cuando el router lo ofrece.
- **Sin código QR, un mensaje en su lugar**: el mensaje indica el motivo
  (contraseña demasiado corta, nombre demasiado largo).

## Límites

- El panel muestra la contraseña a cualquiera que pueda verlo, paneles
  públicos incluidos: use una red de invitados.
- Tres redes como máximo.
- La integración no lee ni modifica el router: la contraseña es la indicada
  aquí o enviada por una escena.
- Aún no escaneado con todos los modelos de teléfono (vea la nota de arriba).

## Créditos

- Códigos QR generados con
  [node-qrcode](https://github.com/soldair/node-qrcode) (MIT).
- Formato de QR Wi-Fi del proyecto [ZXing](https://github.com/zxing/zxing)
  (Apache 2.0).
- Sin relación con la Wi-Fi Alliance.
