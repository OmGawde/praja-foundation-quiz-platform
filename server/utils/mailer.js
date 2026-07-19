const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  // ═══════════════════════════════════════════
  // Priority 1: Use Resend HTTP API (works on Render, no SMTP ports needed)
  // ═══════════════════════════════════════════
  if (process.env.RESEND_API_KEY) {
    const replyTo = process.env.SMTP_USER || undefined;
    console.log(`📧 Sending email via Resend API to: ${to}`);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: 'Praja Quiz Platform <onboarding@resend.dev>',
        reply_to: replyTo,
        to: [to],
        subject,
        html
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Resend API error:', JSON.stringify(data));
      throw new Error(data.message || 'Resend API failed');
    }

    console.log(`✅ Email sent successfully via Resend. ID: ${data.id}`);
    return { success: true, id: data.id };
  }

  // ═══════════════════════════════════════════
  // Priority 2: Use SMTP (for local development or non-Render hosts)
  // ═══════════════════════════════════════════
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const dns = require('dns');
    const { promisify } = require('util');
    const resolve4 = promisify(dns.resolve4);

    const smtpHost = process.env.SMTP_HOST;
    let resolvedHost = smtpHost;

    try {
      const addresses = await resolve4(smtpHost);
      if (addresses && addresses.length > 0) {
        resolvedHost = addresses[0];
        console.log(`📡 Resolved SMTP host ${smtpHost} → IPv4 ${resolvedHost}`);
      }
    } catch (dnsErr) {
      console.log(`⚠️ IPv4 DNS resolution failed, using original hostname.`);
    }

    const smtpPort = parseInt(process.env.SMTP_PORT) || 465;
    const isSecure = smtpPort === 465;

    console.log(`📧 Connecting to SMTP: ${resolvedHost}:${smtpPort} (secure: ${isSecure})`);

    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false,
        servername: smtpHost
      },
      connectionTimeout: 10000,
      greetingTimeout: 10000
    });

    await transporter.sendMail({
      from: `"Praja Quiz Platform" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html
    });

    console.log(`✅ Email sent successfully via SMTP to: ${to}`);
    return { success: true };
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
