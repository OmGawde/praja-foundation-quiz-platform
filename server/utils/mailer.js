const nodemailer = require('nodemailer');
const dns = require('dns');
const { promisify } = require('util');
const resolve4 = promisify(dns.resolve4);

const sendEmail = async ({ to, subject, html }) => {
  // ═══════════════════════════════════════════
  // Priority 1: Use Nodemailer SMTP (Gmail) — works on Railway, direct delivery
  // ═══════════════════════════════════════════
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const isSecure = smtpPort === 465;

    // Force IPv4 resolution (Railway can't reach Gmail over IPv6)
    let smtpHost = process.env.SMTP_HOST;
    try {
      const addresses = await resolve4(smtpHost);
      if (addresses && addresses.length > 0) {
        console.log(`📡 Resolved ${smtpHost} → IPv4 ${addresses[0]}`);
        smtpHost = addresses[0];
      }
    } catch (e) {
      console.log(`⚠️ IPv4 DNS resolution failed, using hostname directly`);
    }

    console.log(`📧 Sending email via Gmail SMTP to: ${to} (from: ${process.env.SMTP_USER})`);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false,
        servername: process.env.SMTP_HOST
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000
    });

    const info = await transporter.sendMail({
      from: `"Praja Quiz Platform" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });

    console.log(`✅ Email sent successfully via SMTP to: ${to} (ID: ${info.messageId})`);
    return { success: true, id: info.messageId };
  }

  // ═══════════════════════════════════════════
  // Priority 2: Use Brevo HTTP API (fallback if SMTP not configured)
  // ═══════════════════════════════════════════
  if (process.env.BREVO_API_KEY) {
    const fromEmail = process.env.SMTP_USER || 'omgawde1206@gmail.com';
    console.log(`📧 Sending email via Brevo API to: ${to} (from: ${fromEmail})`);

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Praja Quiz Platform', email: fromEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Brevo API error:', JSON.stringify(data));
      throw new Error(data.message || 'Brevo API failed');
    }

    console.log(`✅ Email sent successfully via Brevo. ID: ${data.messageId}`);
    return { success: true, id: data.messageId };
  }

  // ═══════════════════════════════════════════
  // Fallback: Log to console (development mode)
  // ═══════════════════════════════════════════
  console.log(`\n📧 [MAIL FALLBACK - NO EMAIL PROVIDER CONFIGURED]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Content:\n${html.replace(/<[^>]*>/g, '')}`);
  console.log(`═════════════════════════════════════════\n`);
  return { success: true, logged: true };
};

module.exports = sendEmail;
