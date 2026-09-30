import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;

const hasSmtp = Boolean(smtpHost);

const transporter = hasSmtp
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: smtpUser
        ? {
            user: smtpUser,
            pass: smtpPass,
          }
        : undefined,
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 20000,
    })
  : nodemailer.createTransport({
      jsonTransport: true,
    });

export async function sendEmail({ to, subject, text }) {
  if (!to || !subject || !text) {
    throw new Error('Recipient, subject, and email text are required.');
  }

  const info = await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    text,
  });

  if (!hasSmtp) {
    console.log('[Email preview — SMTP_HOST is empty]');
    console.log(info.message);
    return info;
  }

  console.log('Email accepted by SMTP server:', info.messageId);

  return info;
}

export async function verifyEmailConnection() {
  if (!hasSmtp) {
    console.log('SMTP is not configured. Emails will not be sent.');
    return false;
  }

  await transporter.verify();
  console.log('SMTP connection verified.');

  return true;
}

export function closeEmailConnection() {
  transporter.close();
}