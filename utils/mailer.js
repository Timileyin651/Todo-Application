const nodemailer = require("nodemailer");
require("dotenv").config();
const APP_URL = (process.env.APP_URL || "http://localhost:8000").replace(/\/+$/, "");

const PORT = process.env.SMTP_PORT;
const HOST = process.env.SMTP_HOST;

const transporter = nodemailer.createTransport({
  host: HOST,
  port: PORT,
  secure: PORT === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function formatUtc(date) {
  return date
    ? `${date.toISOString().replace("T", " ").slice(0, 16)} UTC`
    : "not set";
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

async function SendOverDueEmail(task, user) {
  const dueDate = formatUtc(task.end_at);
  const taskUrl = `${APP_URL}/tasks/${task.id}`;

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: `Task Overdue: ${task.title}`,
    text:
      `Your task "${task.title}" passed its end time (${dueDate}) and is now marked Overdue.\n\n` +
      (task.description ? `${task.description}\n\n` : "") +
      `Open it in Crossly to update it: ${taskUrl}`,
    html:
      `<p>Your task <strong>${escapeHtml(task.title)}</strong> passed its end time ` +
      `(${escapeHtml(dueDate)}) and is now marked <strong>Overdue</strong>.</p>` +
      (task.description ? `<p>${escapeHtml(task.description)}</p>` : "") +
      `<p><a href="${escapeHtml(taskUrl)}" ` +
      `style="display:inline-block;padding:10px 18px;background:#4f46e5;color:#ffffff;` +
      `text-decoration:none;border-radius:6px;font-weight:600;">Open task in Crossly</a></p>` +
      `<p style="font-size:12px;color:#666;">Button not working? Copy this link into your browser:<br>` +
      `${escapeHtml(taskUrl)}</p>`,
  });
}

module.exports = { SendOverDueEmail}
