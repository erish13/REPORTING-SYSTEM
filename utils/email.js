const nodemailer = require('nodemailer');

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  const from = process.env.EMAIL_FROM;

  if (!host || !user || !pass || !from) {
    throw new Error('Incomplete SMTP configuration for forgot-password emails');
  }

  const secure = String(process.env.EMAIL_SECURE || '').toLowerCase() === 'true';

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });

  return transporter;
}

async function sendResetEmail({ to, otp, expiresInMinutes = 15 }) {
  const transport = getTransporter();
  const from = process.env.EMAIL_FROM;
  const subject = 'Reporting System — Password Reset Code';

  const textBody = [
    `A password reset request was received for ${to}.`,
    `Your 6-digit reset code is: ${otp}`,
    `This code expires in ${expiresInMinutes} minutes.`,
    '',
    'If you did not request a password reset, you can ignore this email.',
  ].join('\n');

  const htmlBody = `
    <p>A password reset request was received for <strong>${to}</strong>.</p>
    <p style="font-size: 18px; margin: 20px 0;"><strong>Your 6-digit reset code:</strong></p>
    <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1b5e3f;">${otp}</p>
    <p>This code expires in ${expiresInMinutes} minutes.</p>
    <p style="color: #666; font-size: 12px;">If you did not request a password reset, you can ignore this email.</p>
  `;

  await transport.sendMail({
    from,
    to,
    subject,
    text: textBody,
    html: htmlBody,
  });
}

module.exports = { sendResetEmail };
