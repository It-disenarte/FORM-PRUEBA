# Formulario de contacto con medición — Diseñarte México

Proyecto de prueba autocontenido. Sirve para verificar que el circuito completo funciona
— formulario → correo → conversión — antes de llevarlo al sitio de producción.

## Qué contiene

```
index.html          El formulario, con las etiquetas de medición y un panel de diagnóstico
api/contact.js      Función serverless: valida, filtra spam y envía el correo por SMTP de Zoho
package.json        Dependencia de nodemailer
vercel.json         URLs limpias
.env.example        Plantilla de variables de entorno
```

Los archivos `ContactForm.dc.html`, `support.js` y `_ds/` son la versión de Claude Design
del componente. **No se usan en el despliegue**; `index.html` es autónomo y no depende de ellos.

## Cuentas conectadas

| Servicio | ID |
|---|---|
| Google Analytics 4 | `G-H2JJVE75F3` |
| Google Ads | `AW-16751651845` |
| Meta Pixel | `2039038839979376` |

## 1. App Password de Zoho

Entra a la cuenta que va a enviar los correos (`administracion@disenartemx.com`):
Configuración de cuenta → Seguridad → App Passwords → crea una para "Vercel contact form".

**No uses la contraseña normal de la cuenta.**

## 2. Variables de entorno en Vercel

Settings → Environment Variables, marcando **Production y Preview**:

- `ZOHO_USER` = `administracion@disenartemx.com`
- `ZOHO_APP_PASSWORD` = la App Password del paso 1

Sin estas variables el endpoint responde 500 aunque el código esté bien.

## 3. Desplegar

```
vercel deploy
```

O conecta el repositorio desde el panel de Vercel. La carpeta `api/` se publica sola
como Serverless Function en `/api/contact`.

⚠️ El `package.json` tiene que estar en la raíz del proyecto que despliegas, o Vercel
no instala `nodemailer` y la función truena.

## 4. Pegar la etiqueta de conversión

En Google Ads: Objetivos → Conversiones → Nueva acción de conversión → Sitio web →
Configurar manualmente. Categoría "Envío de formulario de posible cliente".

Al guardar te da un código con `send_to: 'AW-16751651845/AbC-D_efGhIjKl'`.
Lo que va después de la diagonal es la etiqueta.

Pégala en `index.html`, en esta línea:

```js
const AW_LABEL_FORMULARIO = 'REEMPLAZAR_ETIQUETA_FORMULARIO';
```

Mientras diga REEMPLAZAR, el evento llega a GA4 y a Meta pero **no** a Google Ads.
El panel de diagnóstico te lo va a marcar en rojo, que es el comportamiento correcto.

## 5. Cómo probar

Abre la URL desplegada **simulando la llegada desde un anuncio**:

```
https://tu-proyecto.vercel.app/?utm_source=prueba&utm_campaign=test&gclid=ABC123
```

El panel de diagnóstico, debajo del formulario, debe mostrar en verde
`Origen: test · gclid presente`.

Llena y envía. Deberías ver:

| Línea | Estado esperado |
|---|---|
| GA4 | verde — `generate_lead` enviado |
| Meta | verde — `Lead` enviado |
| Google Ads | rojo hasta que pegues la etiqueta, luego verde |

Y el correo debe llegar a `it@disenartemx.com` con copia a `marketing@disenartemx.com`,
con un bloque de origen al final mostrando la campaña y el `gclid`.

### Verificación externa

- **Tag Assistant** (`tagassistant.google.com`) — muestra en vivo qué etiquetas se dispararon
- **GA4 → Informes → Tiempo real** — `generate_lead` aparece en menos de un minuto
- **Panel de Google Ads** — tarda de 3 a 24 horas. Que no aparezca de inmediato no significa que falló.

## Protecciones incluidas

- Campo honeypot `sitio_web` oculto fuera de pantalla
- Tiempo mínimo de 3 segundos entre carga y envío
- Límite de 5 envíos por hora por IP
- Validación de formato de correo
- Limpieza de saltos de línea en el asunto, para evitar inyección de cabeceras
- Escapado de HTML en todos los campos

## Al pasarlo a producción

Cambiar los destinatarios de `api/contact.js`: `it@` y `marketing@` son de prueba.
En producción van `ventas@disenartemx.com` con copia a `direccion@disenartemx.com`.

También hay que verificar el dominio en el proveedor de correo (SPF y DKIM) para que
los mensajes no caigan en spam — coordinar con la migración a Zoho Mail.
