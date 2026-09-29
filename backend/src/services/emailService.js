import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const { smtp } = env;
const transporter = smtp.host
  ? nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.port === 465,
      auth: smtp.user ? { user: smtp.user, pass: smtp.pass } : undefined,
    })
  : nodemailer.createTransport({ jsonTransport: true });

export async function sendEmail({ to, subject, text }) {
  const info = await transporter.sendMail({ from: smtp.from, to, subject, text });
  if (!smtp.host) console.log('[email not sent: SMTP_HOST is empty]', info.message);
}
