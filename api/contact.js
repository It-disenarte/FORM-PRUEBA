const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.ZOHO_USER,
    pass: process.env.ZOHO_APP_PASSWORD
  }
});

// Límite por IP. En serverless vive por instancia, no es infalible,
// pero frena el spam repetitivo sin agregar dependencias.
const intentos = new Map();
function limitado(ip) {
  const ahora = Date.now();
  const previos = (intentos.get(ip) || []).filter(t => ahora - t < 3600000);
  if (previos.length >= 5) return true;
  previos.push(ahora);
  intentos.set(ip, previos);
  return false;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconocida';
  if (limitado(ip)) {
    res.status(429).json({ error: 'demasiados_intentos' });
    return;
  }

  const b = req.body || {};
  const {
    nombre, empresa, email, telefono, asunto, mensaje,
    utm_source, utm_medium, utm_campaign, gclid, pagina_origen,
    sitio_web, ts
  } = b;

  // Honeypot: si viene lleno es un bot. Respondemos 200 para no darle pistas.
  if (sitio_web && String(sitio_web).trim()) {
    res.status(200).json({ ok: true });
    return;
  }

  // Un humano no llena el formulario en menos de 3 segundos.
  if (!ts || Date.now() - Number(ts) < 3000) {
    res.status(400).json({ error: 'demasiado_rapido' });
    return;
  }

  if (!nombre || !email || !asunto || !mensaje) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email))) {
    res.status(400).json({ error: 'email_invalido' });
    return;
  }

  // El asunto va en una cabecera de correo: los saltos de línea se quitan
  // para evitar inyección de cabeceras.
  const asuntoLimpio = String(asunto).replace(/[\r\n]+/g, ' ').slice(0, 120);

  const origen = (gclid || utm_source)
    ? `
      <hr>
      <p style="color:#666;font-size:13px"><strong>Origen del lead</strong></p>
      <p style="font-size:13px">
        Campaña: ${escapeHtml(utm_campaign || '—')}<br>
        Fuente: ${escapeHtml(utm_source || '—')}<br>
        Medio: ${escapeHtml(utm_medium || '—')}<br>
        gclid: ${escapeHtml(gclid || '—')}<br>
        Página de entrada: ${escapeHtml(pagina_origen || '—')}
      </p>`
    : `<hr><p style="color:#666;font-size:13px">Origen: directo (sin campaña identificada)</p>`;

  try {
    await transporter.sendMail({
      from: `Formulario de contacto <${process.env.ZOHO_USER}>`,
      to: 'it@disenartemx.com',
      cc: 'marketing@disenartemx.com',
      replyTo: email,
      subject: `Nuevo contacto: ${asuntoLimpio}`,
      html: `
        <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        <p><strong>Empresa:</strong> ${escapeHtml(empresa || '—')}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(telefono || '—')}</p>
        <p><strong>Asunto:</strong> ${escapeHtml(asuntoLimpio)}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(mensaje).replace(/\n/g, '<br>')}</p>
        ${origen}
      `
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Fallo SMTP:', err.message);
    res.status(500).json({ error: 'send_failed' });
  }
};

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
