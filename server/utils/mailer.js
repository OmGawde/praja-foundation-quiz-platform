const nodemailer = require('nodemailer');
const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);

const sendEmail = async ({ to, subject, html }) => {
  // If SMTP configurations are missing, log to console for development
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log(`\n📧 [MAIL OVERRIDE - SMTP UNCONFIGURED]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content:\n${html.replace(/<[^>]*>/g, '')}`);
    console.log(`═════════════════════════════════════════\n`);
    return { success: true, logged: true };
  }

  const smtpHost = process.env.SMTP_HOST;
  let resolvedHost = smtpHost;

  // Manually resolve hostname to IPv4 to avoid ENETUNREACH on platforms
  // where IPv6 is not available (e.g. Render free tier)
  try {
    const addresses = await resolve4(smtpHost);
    if (addresses && addresses.length > 0) {
      resolvedHost = addresses[0];
      console.log(`📡 Resolved SMTP host ${smtpHost} → IPv4 ${resolvedHost}`);
    }
  } catch (dnsErr) {
    console.log(`⚠️ IPv4 DNS resolution failed for ${smtpHost}, using original hostname. Error: ${dnsErr.message}`);
  }

    // Render blocks port 587 (STARTTLS). Use port 465 (SSL) by default.
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
        servername: smtpHost  // Required for TLS handshake when connecting via raw IP
      },
      connectionTimeout: 10000,  // 10 second timeout
      greetingTimeout: 10000
    });

  await transporter.sendMail({
    from: `"Praja Quiz Platform" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html
  });

  return { success: true };
};

module.exports = sendEmail;
