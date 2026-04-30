import nodemailer from "nodemailer";
import { wrapEmailTemplate } from "./email-template";

interface SendEmailOpts {
  to: string;
  subject: string;
  /** Inner body HTML — will be wrapped in the branded template automatically. */
  html: string;
  text?: string;
  fromEmail: string;
  fromName: string;
  /** Extra branding passed to the template wrapper. */
  gymName?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  /** Set true to skip the template wrapper (e.g. already-wrapped HTML). */
  raw?: boolean;
}

/**
 * Send a single email. Prefers Resend (RESEND_API_KEY) — no IP restrictions.
 * Falls back to Nodemailer SMTP if Resend is not configured.
 */
export async function sendEmail(opts: SendEmailOpts): Promise<void> {
  const html = opts.raw
    ? opts.html
    : wrapEmailTemplate({
        body: opts.html,
        gymName: opts.gymName ?? opts.fromName,
        contactEmail: opts.contactEmail,
        contactPhone: opts.contactPhone,
        logoUrl: opts.logoUrl,
      });

  const resendKey = process.env.RESEND_API_KEY;

  if (resendKey) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${opts.fromName} <${opts.fromEmail}>`,
        to: [opts.to],
        subject: opts.subject,
        html,
        text: opts.text,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({})) as any;
      throw new Error(`Resend: ${err?.message ?? res.statusText}`);
    }
    return;
  }

  // SMTP fallback
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error("No email provider configured. Set RESEND_API_KEY in your environment variables.");
  }

  const transporter = nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"${opts.fromName}" <${opts.fromEmail}>`,
    to: opts.to,
    subject: opts.subject,
    html,
    text: opts.text,
  });
}

/**
 * Send the same email to multiple recipients (one API call per recipient via
 * Resend batch, or individual SMTP calls as fallback).
 */
export async function sendBulkEmail(
  recipients: { to: string; firstName: string }[],
  subject: string,
  buildHtml: (firstName: string) => string,
  fromEmail: string,
  fromName: string,
  gymName?: string,
): Promise<{ sent: number; failed: number }> {
  const wrap = (firstName: string) =>
    wrapEmailTemplate({ body: buildHtml(firstName), gymName: gymName ?? fromName });

  const resendKey = process.env.RESEND_API_KEY;
  let sent = 0;
  let failed = 0;

  if (resendKey) {
    // Resend supports up to 100 emails per batch call
    const BATCH = 100;
    for (let i = 0; i < recipients.length; i += BATCH) {
      const chunk = recipients.slice(i, i + BATCH);
      const body = chunk.map(r => ({
        from: `${fromName} <${fromEmail}>`,
        to: [r.to],
        subject,
        html: wrap(r.firstName),
      }));

      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        sent += chunk.length;
      } else {
        failed += chunk.length;
      }
    }
    return { sent, failed };
  }

  // SMTP fallback — send one at a time
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) return { sent: 0, failed: recipients.length };

  const transporter = nodemailer.createTransport({
    host, port,
    secure: port === 465,
    auth: { user, pass },
  });

  const results = await Promise.allSettled(
    recipients.map(r =>
      transporter.sendMail({
        from: `"${fromName}" <${fromEmail}>`,
        to: r.to,
        subject,
        html: wrap(r.firstName),
      })
    )
  );

  for (const r of results) {
    r.status === "fulfilled" ? sent++ : failed++;
  }
  return { sent, failed };
}
