# Desplegar en Vercel

## 1. Cuenta de correo en Zoho
1. Entra a la cuenta de Zoho Mail que enviará los correos (ej. contacto@disenartemx.com).
2. Genera una App Password: Configuración de cuenta → Seguridad → App Passwords → crear una para "Vercel contact form". No uses la contraseña normal de la cuenta.

## 2. Estructura del proyecto
- `index.html` — el formulario (archivo estático, autocontenido).
- `api/contact.js` — función serverless que envía el correo vía SMTP de Zoho (nodemailer).
- `package.json` — dependencia de `nodemailer`.

## 3. Variables de entorno en Vercel
En el dashboard del proyecto → Settings → Environment Variables:
- `ZOHO_USER` = la cuenta de Zoho que envía (ej. contacto@disenartemx.com)
- `ZOHO_APP_PASSWORD` = la App Password generada en el paso 1

## 4. Deploy
```
vercel deploy
```
o conecta el repo desde el dashboard de Vercel. El endpoint `/api/contact` se despliega automáticamente como Serverless Function.

Los correos llegan a **it@disenartemx.com** con copia a **marketing@disenartemx.com**, y el `reply-to` queda en el email de quien llenó el formulario.
