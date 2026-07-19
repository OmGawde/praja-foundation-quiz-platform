const nodemailer = require('nodemailer');

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

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: (process.env.SMTP_PORT === '465'),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
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
