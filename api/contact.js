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

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const { nombre, empresa, email, telefono, asunto, mensaje } = req.body || {};

  if (!nombre || !email || !asunto || !mensaje) {
    res.status(400).json({ error: 'missing_fields' });
    return;
  }

  try {
    await transporter.sendMail({
      from: `Formulario de contacto <${process.env.ZOHO_USER}>`, // administracion@disenartemx.com
      to: 'it@disenartemx.com',
      cc: 'marketing@disenartemx.com',
      replyTo: email,
      subject: `Nuevo contacto: ${asunto}`,
      html: `
        <p><strong>Nombre:</strong> ${escapeHtml(nombre)}</p>
        <p><strong>Empresa:</strong> ${escapeHtml(empresa || '—')}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Teléfono:</strong> ${escapeHtml(telefono || '—')}</p>
        <p><strong>Asunto:</strong> ${escapeHtml(asunto)}</p>
        <p><strong>Mensaje:</strong></p>
        <p>${escapeHtml(mensaje).replace(/\n/g, '<br>')}</p>
      `
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error(err);
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
