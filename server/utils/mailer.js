const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  // ═══════════════════════════════════════════
  // Nodemailer SMTP (Gmail) — direct delivery via IPv6 on Railway
  // ═══════════════════════════════════════════
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
    const isSecure = smtpPort === 465;

    console.log(`📧 Sending email via Gmail SMTP to: ${to} (from: ${process.env.SMTP_USER}, port: ${smtpPort})`);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: isSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
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
